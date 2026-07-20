/**
 * Kanban board domain — schema v2 types, v1→v2 migration, and pure helpers.
 *
 * CS-59: the board file (docs/cs-board.json) gains checklists, start/due
 * dates, and a comment/activity log per card. This module is deliberately
 * free of React and server code so the migration and grouping logic are
 * unit-testable; app/studio/board.ts applies `migrateBoard` on read and the
 * client persists the migrated shape on its first write.
 */

export interface KanbanColumn {
  id:    string;
  title: string;
  order: number;
}

export interface KanbanChecklistItem {
  id:   string;
  text: string;
  done: boolean;
}

export interface KanbanComment {
  id:        string;
  text:      string;
  createdAt: string;
  /** "comment" = written by the user; "activity" = automatic log entry. */
  type: "comment" | "activity";
}

export interface KanbanCard {
  id:          string;
  columnId:    string;
  csNumber:    string;
  title:       string;
  description: string;
  labels:      string[];
  version:     string;
  commitHash:  string;
  completedAt: string | null;
  order:       number;
  // v2 fields
  startedAt: string | null;
  dueAt:     string | null;
  checklist: KanbanChecklistItem[];
  comments:  KanbanComment[];
  // CS-76 (phase B): PR that carried this CS — set on review/done cards.
  prNumber:  number | null;
}

export interface KanbanBoard {
  version:     number;
  lastUpdated: string;
  columns:     KanbanColumn[];
  cards:       KanbanCard[];
  /** CS-76: true when the GitHub source failed and the board fell back to the
   *  local git file — the done/review view may be behind origin/main. */
  stale?: boolean;
}

export const BOARD_SCHEMA_VERSION = 2;

/**
 * Migrates a raw parsed board (v1 or v2) to the v2 shape. Idempotent —
 * v2 boards pass through unchanged. Unknown/missing v2 fields get safe
 * defaults so a v1 file keeps working without a manual rewrite.
 */
export function migrateBoard(raw: unknown): KanbanBoard {
  const b = raw as KanbanBoard;
  return {
    version: BOARD_SCHEMA_VERSION,
    lastUpdated: b.lastUpdated ?? new Date().toISOString(),
    columns: b.columns ?? [],
    cards: (b.cards ?? []).map((c) => ({
      id:          c.id,
      columnId:    c.columnId,
      csNumber:    c.csNumber ?? "",
      title:       c.title ?? "",
      description: c.description ?? "",
      labels:      Array.isArray(c.labels) ? c.labels : [],
      version:     c.version ?? "",
      commitHash:  c.commitHash ?? "",
      completedAt: c.completedAt ?? null,
      order:       typeof c.order === "number" ? c.order : 0,
      startedAt:   c.startedAt ?? null,
      dueAt:       c.dueAt ?? null,
      checklist:   Array.isArray(c.checklist) ? c.checklist : [],
      comments:    Array.isArray(c.comments) ? c.comments : [],
      prNumber:    typeof c.prNumber === "number" ? c.prNumber : null,
    })),
  };
}

/** Appends an automatic activity entry to a card's log. */
export function withActivity(card: KanbanCard, text: string): KanbanCard {
  return {
    ...card,
    comments: [
      ...card.comments,
      {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text,
        createdAt: new Date().toISOString(),
        type: "activity",
      },
    ],
  };
}

/**
 * Compares two release strings ("1.14.1") numerically, descending —
 * newer releases first. Non-parsable strings sort after parsable ones.
 */
export function compareVersionsDesc(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa && !pb) return a.localeCompare(b);
  if (!pa) return 1;
  if (!pb) return -1;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pb[i] - pa[i];
  }
  return 0;
}

function parseVersion(v: string): [number, number, number] | null {
  const m = v.trim().match(/^v?(\d+)\.(\d+)(?:\.(\d+))?$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)];
}

export interface ReleaseGroup {
  /** Release string, or "" for cards without a version. */
  release: string;
  cards: KanbanCard[];
}

/**
 * Groups cards by release (version field), newest release first;
 * cards without a version land in a final "" group. Card order inside
 * each group preserves the input order (caller sorts beforehand).
 */
export function groupByRelease(cards: KanbanCard[]): ReleaseGroup[] {
  const byRelease = new Map<string, KanbanCard[]>();
  for (const c of cards) {
    const key = c.version.trim();
    if (!byRelease.has(key)) byRelease.set(key, []);
    byRelease.get(key)!.push(c);
  }
  const releases = [...byRelease.keys()].sort((a, b) => {
    // Unreleased-but-done cards (empty version) accumulate in a group that
    // sits at the TOP of Concluídas — it's the batch awaiting the next
    // release. Tagged releases follow, newest first.
    if (a === "") return -1;
    if (b === "") return 1;
    return compareVersionsDesc(a, b);
  });
  return releases.map((release) => ({ release, cards: byRelease.get(release)! }));
}

/**
 * CS-76: the columns whose cards live in the local Postgres layer (editable,
 * pre-PR). Everything else (done/approved, and later review) is owned by git
 * and read-only. Kept here so both the server assembly and the client lock
 * logic share one definition.
 */
export const LOCAL_COLUMN_IDS = ["backlog", "blocked", "in-progress"] as const;
export type LocalColumnId = (typeof LOCAL_COLUMN_IDS)[number];

export function isLocalColumn(columnId: string): columnId is LocalColumnId {
  return (LOCAL_COLUMN_IDS as readonly string[]).includes(columnId);
}

/** CS-76 (phase B): the synthetic column projected from open PRs. GitHub-owned
 *  and read-only — it exists only in the assembled view, never in storage. */
export const REVIEW_COLUMN_ID = "review";
export const REVIEW_COLUMN: KanbanColumn = { id: REVIEW_COLUMN_ID, title: "Revisão", order: 2.5 };

/** An open PR resolved to its CS number (same resolution as roadmap-sync). */
export interface OpenPRRef {
  csNumber: string;
  prNumber: number;
  title:    string;
}

/** Resolves a CS number from a PR title or head branch — mirrors
 *  scripts/roadmap-move-to-done.mjs so view and automation agree. */
export function resolveCsNumber(title: string, branch: string): string | null {
  // Board CS numbers are "CS-NN" with an optional lowercase suffix ("CS-37b").
  const fromTitle = title.match(/CS-(\d+[a-z]?)/i);
  if (fromTitle) return `CS-${fromTitle[1].toLowerCase()}`;
  const fromBranch = branch.match(/^[a-z]+\/(\d+[a-z]?)[-_]/i);
  if (fromBranch) return `CS-${fromBranch[1].toLowerCase()}`;
  return null;
}

/**
 * Assembles the board the Studio renders from its three sources, with
 * precedence main > open PR > local:
 *
 *  - git board (`done` archive)        → Concluídas, locked
 *  - open PRs (GitHub API)             → Revisão (synthetic column), locked
 *  - local cards (Postgres)            → Backlog / Bloqueado / Em andamento
 *
 * A CS in `done` drops its PR/local copies; a CS in an open PR projects its
 * local card into Revisão (or synthesizes one from the PR title). Local rows
 * of promoted cards survive as annotation satellites: their checklist and
 * comments are spliced onto the locked git card (read-only) so planning notes
 * are not lost at promotion.
 */
export function assembleBoard(
  gitBoard: KanbanBoard,
  localCards: KanbanCard[],
  openPRs: OpenPRRef[] = []
): KanbanBoard {
  const byCs = new Map(localCards.filter((c) => c.csNumber).map((c) => [c.csNumber, c]));

  // 1. main wins — done cards, annotated from their local satellite if any.
  const doneCards = gitBoard.cards
    .filter((c) => c.columnId === "done")
    .map((c) => spliceAnnotations(c, byCs.get(c.csNumber)));
  const promoted = new Set(doneCards.map((c) => c.csNumber).filter(Boolean));

  // 2. open PRs — project the local card into Revisão, or synthesize one.
  const reviewCards: KanbanCard[] = [];
  const inReview = new Set<string>();
  for (const pr of openPRs) {
    if (!pr.csNumber || promoted.has(pr.csNumber) || inReview.has(pr.csNumber)) continue;
    inReview.add(pr.csNumber);
    const localCard = byCs.get(pr.csNumber);
    reviewCards.push(
      localCard
        ? { ...localCard, columnId: REVIEW_COLUMN_ID, prNumber: pr.prNumber }
        : {
            id: pr.csNumber, columnId: REVIEW_COLUMN_ID, csNumber: pr.csNumber,
            title: pr.title, description: "", labels: [], version: "", commitHash: "",
            completedAt: null, order: pr.prNumber, startedAt: null, dueAt: null,
            checklist: [], comments: [], prNumber: pr.prNumber,
          }
    );
  }

  // 3. local layer — whatever was not claimed by git or a PR.
  const local = localCards.filter(
    (c) => isLocalColumn(c.columnId) && !promoted.has(c.csNumber) && !inReview.has(c.csNumber)
  );

  const columns = gitBoard.columns.some((c) => c.id === REVIEW_COLUMN_ID)
    ? gitBoard.columns
    : [...gitBoard.columns, REVIEW_COLUMN].sort((a, b) => a.order - b.order);

  return {
    ...gitBoard,
    columns,
    cards: [...local, ...reviewCards, ...doneCards],
  };
}

/** Splices a local satellite's annotations onto a git-owned card (decision
 *  "a": preserved but read-only — the git card stays locked). Git fields win;
 *  only checklist/comments flow in, and only when the git card has none. */
function spliceAnnotations(gitCard: KanbanCard, satellite?: KanbanCard): KanbanCard {
  if (!satellite) return gitCard;
  return {
    ...gitCard,
    checklist: gitCard.checklist.length > 0 ? gitCard.checklist : satellite.checklist,
    comments:  gitCard.comments.length  > 0 ? gitCard.comments  : satellite.comments,
  };
}

/** Days from today (local midnight) until the given ISO date; negative = overdue. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const due = new Date(iso);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86_400_000);
}

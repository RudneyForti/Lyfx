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
}

export interface KanbanBoard {
  version:     number;
  lastUpdated: string;
  columns:     KanbanColumn[];
  cards:       KanbanCard[];
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

/** Days from today (local midnight) until the given ISO date; negative = overdue. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const due = new Date(iso);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86_400_000);
}

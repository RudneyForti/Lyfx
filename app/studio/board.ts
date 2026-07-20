"use server";

import { readFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "./auth";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { fetchGitHubBoard, fetchOpenPRs } from "@/lib/roadmap-github";
import {
  migrateBoard,
  assembleBoard,
  isLocalColumn,
  type KanbanBoard,
  type KanbanCard,
  type KanbanChecklistItem,
  type KanbanComment,
} from "@/lib/kanban";

/* ── Kanban Board (CS-20 · schema v2 in CS-59 · dual-source in CS-76) ── */

// Types live in lib/kanban.ts (pure module) so the v1→v2 migration, grouping
// and assembly helpers are unit-testable. Re-exported via actions.ts barrel.
export type { KanbanBoard, KanbanCard, KanbanColumn, KanbanChecklistItem, KanbanComment } from "@/lib/kanban";

const BOARD_FILE = path.join(process.cwd(), "docs", "cs-board.json");

// Fallback when the board file is absent (returned instead of crashing the
// whole Studio). The Dockerfile ships docs/cs-board.json into the standalone
// image, so this is defense-in-depth — a missing file degrades to an empty
// board rather than a 500.
const DEFAULT_BOARD: KanbanBoard = {
  version: 2,
  lastUpdated: new Date(0).toISOString(),
  columns: [
    { id: "backlog",     title: "Backlog",      order: 0 },
    { id: "in-progress", title: "Em andamento", order: 1 },
    { id: "blocked",     title: "Bloqueado",    order: 2 },
    { id: "done",        title: "Concluídas",   order: 3 },
  ],
  cards: [],
};

/* ── git board (the `done` archive, written by roadmap-sync on merge) ── */

async function readGitBoard(): Promise<KanbanBoard> {
  try {
    const raw = await readFile(BOARD_FILE, "utf-8");
    // v1 files migrate on read; the migrated shape is persisted on the first save.
    return migrateBoard(JSON.parse(raw));
  } catch (err) {
    // Missing file (e.g. not shipped into the build) → empty board, no crash.
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return DEFAULT_BOARD;
    throw err;
  }
}

/* ── local layer (Postgres — the editable, pre-PR columns) ── */

type RoadmapRow = {
  csNumber: string;
  title: string;
  description: string;
  columnId: string;
  labels: string[];
  order: number;
  startedAt: Date | null;
  dueAt: Date | null;
  checklist: unknown;
  comments: unknown;
};

// A local card's stable identity is its CS number — the same key that joins it
// against the git board — so the client keys off it and re-saves are upserts.
function rowToCard(row: RoadmapRow): KanbanCard {
  return {
    id:          row.csNumber,
    columnId:    row.columnId,
    csNumber:    row.csNumber,
    title:       row.title,
    description: row.description,
    labels:      Array.isArray(row.labels) ? row.labels : [],
    version:     "",           // local cards are pre-release by definition
    commitHash:  "",
    completedAt: null,
    order:       row.order,
    startedAt:   row.startedAt ? row.startedAt.toISOString() : null,
    dueAt:       row.dueAt ? row.dueAt.toISOString() : null,
    checklist:   Array.isArray(row.checklist) ? (row.checklist as KanbanChecklistItem[]) : [],
    comments:    Array.isArray(row.comments) ? (row.comments as KanbanComment[]) : [],
    prNumber:    null, // local cards have no PR yet by definition
  };
}

async function listLocalCards(): Promise<KanbanCard[]> {
  const rows = await db.roadmapCard.findMany({ orderBy: { order: "asc" } });
  return rows.map(rowToCard);
}

/**
 * Persists the local-column cards to Postgres: upsert every local card by its
 * CS number, then prune rows whose CS vanished from the board entirely (user
 * deleted the card). Rows whose CS moved to a git-owned column (review/done)
 * are KEPT untouched — they become annotation satellites, spliced back onto
 * the locked git card by assembleBoard (CS-76 decision "a").
 */
async function saveLocalCards(cards: KanbanCard[]): Promise<void> {
  const local = cards.filter((c) => isLocalColumn(c.columnId) && c.csNumber.trim() !== "");
  // keep = every CS still on the board, in ANY column — not just local ones.
  const keep = new Set(cards.map((c) => c.csNumber).filter((n) => n.trim() !== ""));

  // Safety: an empty keep-set would make `notIn: []` match EVERY row and wipe
  // the local layer. A legitimate save never has zero CS numbers on the board,
  // so treat it as a malformed payload and refuse to prune.
  if (keep.size === 0) {
    if (local.length > 0) throw new Error("saveLocalCards: inconsistent board payload");
    return;
  }

  await db.$transaction([
    db.roadmapCard.deleteMany({ where: { csNumber: { notIn: [...keep] } } }),
    ...local.map((c) =>
      db.roadmapCard.upsert({
        where: { csNumber: c.csNumber },
        create: {
          csNumber:    c.csNumber,
          title:       c.title,
          description: c.description,
          columnId:    c.columnId,
          labels:      c.labels,
          order:       c.order,
          startedAt:   c.startedAt ? new Date(c.startedAt) : null,
          dueAt:       c.dueAt ? new Date(c.dueAt) : null,
          checklist:   c.checklist as unknown as Prisma.InputJsonValue,
          comments:    c.comments as unknown as Prisma.InputJsonValue,
        },
        update: {
          title:       c.title,
          description: c.description,
          columnId:    c.columnId,
          labels:      c.labels,
          order:       c.order,
          startedAt:   c.startedAt ? new Date(c.startedAt) : null,
          dueAt:       c.dueAt ? new Date(c.dueAt) : null,
          checklist:   c.checklist as unknown as Prisma.InputJsonValue,
          comments:    c.comments as unknown as Prisma.InputJsonValue,
        },
      })
    ),
  ]);
}

/* ── public API (unchanged shape — the Studio still sees one KanbanBoard) ── */

export async function getKanbanBoard(): Promise<KanbanBoard> {
  await requireAdmin();
  // CS-76 phase B: GitHub (origin/main + open PRs) is the source of truth for
  // the git-owned columns; the local file is only the offline fallback.
  const [ghBoard, openPRs, localCards] = await Promise.all([
    fetchGitHubBoard(),
    fetchOpenPRs(),
    listLocalCards(),
  ]);
  const gitBoard = ghBoard ?? (await readGitBoard());
  const board = assembleBoard(gitBoard, localCards, openPRs ?? []);
  // stale when either GitHub read failed — done may lag main, review may be missing.
  board.stale = ghBoard === null || openPRs === null;
  return board;
}

export async function saveKanbanBoard(board: KanbanBoard): Promise<{ ok: boolean }> {
  await requireAdmin();
  // Only the local layer is writable from the Studio; the git `done` archive is
  // authoritative and is never rewritten from the UI.
  await saveLocalCards(board.cards);
  return { ok: true };
}

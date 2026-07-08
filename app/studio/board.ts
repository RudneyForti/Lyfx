"use server";

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "./auth";
import { migrateBoard, type KanbanBoard } from "@/lib/kanban";

/* ── Kanban Board (CS-20 · schema v2 in CS-59) ── */

// Types live in lib/kanban.ts (pure module) so the v1→v2 migration and
// grouping helpers are unit-testable. Re-exported via actions.ts barrel.
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

export async function getKanbanBoard(): Promise<KanbanBoard> {
  await requireAdmin();
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

export async function saveKanbanBoard(board: KanbanBoard): Promise<{ ok: boolean }> {
  await requireAdmin();
  const updated: KanbanBoard = { ...migrateBoard(board), lastUpdated: new Date().toISOString() };
  await writeFile(BOARD_FILE, JSON.stringify(updated, null, 2), "utf-8");
  return { ok: true };
}

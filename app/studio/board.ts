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

export async function getKanbanBoard(): Promise<KanbanBoard> {
  await requireAdmin();
  const raw = await readFile(BOARD_FILE, "utf-8");
  // v1 files migrate on read; the migrated shape is persisted on the first save.
  return migrateBoard(JSON.parse(raw));
}

export async function saveKanbanBoard(board: KanbanBoard): Promise<{ ok: boolean }> {
  await requireAdmin();
  const updated: KanbanBoard = { ...migrateBoard(board), lastUpdated: new Date().toISOString() };
  await writeFile(BOARD_FILE, JSON.stringify(updated, null, 2), "utf-8");
  return { ok: true };
}

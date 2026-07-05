"use server";

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "./auth";

/* ── Kanban Board (CS-20) ── */

export interface KanbanColumn {
  id:    string;
  title: string;
  order: number;
}

export interface KanbanCard {
  id:           string;
  columnId:     string;
  csNumber:     string;
  title:        string;
  description:  string;
  labels:       string[];
  version:      string;
  commitHash:   string;
  completedAt:  string | null;
  order:        number;
}

export interface KanbanBoard {
  version:     number;
  lastUpdated: string;
  columns:     KanbanColumn[];
  cards:       KanbanCard[];
}

const BOARD_FILE = path.join(process.cwd(), "docs", "cs-board.json");

export async function getKanbanBoard(): Promise<KanbanBoard> {
  await requireAdmin();
  const raw = await readFile(BOARD_FILE, "utf-8");
  return JSON.parse(raw) as KanbanBoard;
}

export async function saveKanbanBoard(board: KanbanBoard): Promise<{ ok: boolean }> {
  await requireAdmin();
  const updated: KanbanBoard = { ...board, lastUpdated: new Date().toISOString() };
  await writeFile(BOARD_FILE, JSON.stringify(updated, null, 2), "utf-8");
  return { ok: true };
}

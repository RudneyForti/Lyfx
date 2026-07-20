import { describe, it, expect, beforeEach, vi } from "vitest";
import type { KanbanCard } from "@/lib/kanban";

// CS-76: saveKanbanBoard persists only the local layer (backlog/blocked/
// in-progress) to Postgres and never rewrites the git `done` archive. These
// tests pin that routing without touching a real database.

vi.mock("@/app/studio/auth", () => ({ requireAdmin: vi.fn().mockResolvedValue(undefined) }));

const { deleteManyMock, upsertMock, txMock } = vi.hoisted(() => ({
  deleteManyMock: vi.fn((args: unknown) => ({ kind: "delete", args })),
  upsertMock: vi.fn((args: unknown) => ({ kind: "upsert", args })),
  txMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db", () => ({
  db: {
    roadmapCard: { deleteMany: deleteManyMock, upsert: upsertMock, findMany: vi.fn() },
    $transaction: txMock,
  },
}));

import { saveKanbanBoard } from "@/app/studio/board";
import type { KanbanBoard } from "@/lib/kanban";

function card(over: Partial<KanbanCard>): KanbanCard {
  return {
    id: over.csNumber ?? "x", columnId: "backlog", csNumber: "CS-1", title: "t",
    description: "", labels: [], version: "", commitHash: "", completedAt: null,
    order: 0, startedAt: null, dueAt: null, checklist: [], comments: [], prNumber: null, ...over,
  };
}

function board(cards: KanbanCard[]): KanbanBoard {
  return { version: 2, lastUpdated: "x", columns: [], cards };
}

beforeEach(() => {
  deleteManyMock.mockClear();
  upsertMock.mockClear();
  txMock.mockClear();
});

describe("saveKanbanBoard — local-layer persistence (CS-76)", () => {
  it("upserts only local-column cards, ignoring git-owned (done) ones", async () => {
    await saveKanbanBoard(board([
      card({ csNumber: "CS-1", columnId: "backlog" }),
      card({ csNumber: "CS-2", columnId: "in-progress" }),
      card({ csNumber: "CS-3", columnId: "done" }),      // git-owned → skip
    ]));

    const upserted = upsertMock.mock.calls.map((c) => (c[0] as { where: { csNumber: string } }).where.csNumber);
    expect(upserted.sort()).toEqual(["CS-1", "CS-2"]);
    expect(upserted).not.toContain("CS-3");
  });

  it("deletes local rows whose CS is no longer present (moved out / removed)", async () => {
    await saveKanbanBoard(board([card({ csNumber: "CS-1", columnId: "backlog" })]));

    expect(deleteManyMock).toHaveBeenCalledTimes(1);
    const where = (deleteManyMock.mock.calls[0][0] as { where: { csNumber: { notIn: string[] } } }).where;
    expect(where.csNumber.notIn).toEqual(["CS-1"]); // keep the surviving local card, delete the rest
  });

  it("skips cards with a blank CS number (no identity to upsert on)", async () => {
    await saveKanbanBoard(board([
      card({ csNumber: "", columnId: "backlog" }),
      card({ csNumber: "CS-9", columnId: "blocked" }),
    ]));

    const upserted = upsertMock.mock.calls.map((c) => (c[0] as { where: { csNumber: string } }).where.csNumber);
    expect(upserted).toEqual(["CS-9"]);
  });
});

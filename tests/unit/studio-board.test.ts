import { describe, it, expect, vi } from "vitest";

// requireAdmin() reads cookies + HMAC and would reject before the file read;
// stub it so the test exercises getKanbanBoard's file handling in isolation.
vi.mock("@/app/studio/auth", () => ({ requireAdmin: vi.fn().mockResolvedValue(undefined) }));

// Hoisted so the vi.mock factory (itself hoisted) can reference it.
const { readFileMock, findManyMock } = vi.hoisted(() => ({
  readFileMock: vi.fn(),
  findManyMock: vi.fn().mockResolvedValue([]),
}));
vi.mock("fs/promises", () => ({ readFile: readFileMock, writeFile: vi.fn() }));
// CS-76: getKanbanBoard now assembles git (done archive) + Postgres (local
// layer). Stub the DB so these tests exercise the git-file side in isolation.
vi.mock("@/lib/db", () => ({ db: { roadmapCard: { findMany: findManyMock } } }));

import { getKanbanBoard } from "@/app/studio/board";

function errWithCode(code: string): NodeJS.ErrnoException {
  const e = new Error(`${code}: simulated`) as NodeJS.ErrnoException;
  e.code = code;
  return e;
}

describe("getKanbanBoard — production file-read resilience (regression: /studio 500)", () => {
  it("returns an empty default board when cs-board.json is missing (ENOENT)", async () => {
    // Repro of the prod bug: the standalone build didn't ship docs/cs-board.json,
    // so readFile threw ENOENT and crashed the whole Studio render.
    readFileMock.mockImplementation(() => { throw errWithCode("ENOENT"); });

    let board, thrownCode;
    try { board = await getKanbanBoard(); } catch (e) { thrownCode = (e as NodeJS.ErrnoException).code; }

    expect(thrownCode).toBeUndefined(); // did not crash
    expect(board!.cards).toEqual([]);
    expect(board!.columns.map((c) => c.id)).toEqual(["backlog", "in-progress", "blocked", "done"]);
    expect(board!.version).toBe(2);
  });

  it("re-throws non-ENOENT errors instead of masking them", async () => {
    readFileMock.mockImplementation(() => { throw errWithCode("EACCES"); });

    let thrownCode;
    try { await getKanbanBoard(); } catch (e) { thrownCode = (e as NodeJS.ErrnoException).code; }

    expect(thrownCode).toBe("EACCES");
  });

  it("parses and migrates the git board's done archive (v1 → v2)", async () => {
    // The git file now contributes only `done` cards to the assembled board —
    // pre-PR columns come from Postgres. A done card must still be migrated.
    readFileMock.mockImplementation(async () =>
      JSON.stringify({
        version: 1,
        columns: [{ id: "done", title: "Concluídas", order: 3 }],
        cards: [{ id: "c1", columnId: "done", csNumber: "CS-1", title: "t", order: 0 }],
      })
    );
    const board = await getKanbanBoard();
    expect(board.version).toBe(2);
    expect(board.cards).toHaveLength(1);
    expect(board.cards[0].csNumber).toBe("CS-1");
    expect(board.cards[0].checklist).toEqual([]); // v2 field added by migration
    expect(board.cards[0].comments).toEqual([]);
  });

  it("drops the git file's non-done cards — the local layer owns those", async () => {
    // A backlog card in the git file is superseded by Postgres; with the DB
    // empty it must not leak into the assembled board.
    readFileMock.mockImplementation(async () =>
      JSON.stringify({
        version: 2,
        columns: [{ id: "backlog", title: "Backlog", order: 0 }],
        cards: [{ id: "c1", columnId: "backlog", csNumber: "CS-9", title: "stale", order: 0 }],
      })
    );
    const board = await getKanbanBoard();
    expect(board.cards).toEqual([]);
  });
});

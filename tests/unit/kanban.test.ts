import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import {
  migrateBoard,
  withActivity,
  compareVersionsDesc,
  groupByRelease,
  daysUntil,
  assembleBoard,
  isLocalColumn,
  resolveCsNumber,
  REVIEW_COLUMN_ID,
  BOARD_SCHEMA_VERSION,
  type KanbanBoard,
  type KanbanCard,
} from "@/lib/kanban";

function v1Card(overrides: Partial<KanbanCard> = {}): Record<string, unknown> {
  // Shape of a card as persisted by the v1 board (no CS-59 fields).
  return {
    id: "cs-01",
    columnId: "done",
    csNumber: "CS-01",
    title: "Sign session cookie",
    description: "HMAC the cookie.",
    labels: ["segurança"],
    version: "1.6.0",
    commitHash: "",
    completedAt: "2026-05-22T00:00:00.000Z",
    order: 0,
    ...overrides,
  };
}

describe("migrateBoard", () => {
  it("adds v2 defaults to v1 cards", () => {
    const board = migrateBoard({
      version: 1,
      lastUpdated: "2026-06-09T01:24:05.724Z",
      columns: [{ id: "done", title: "Concluídas", order: 3 }],
      cards: [v1Card()],
    });
    expect(board.version).toBe(BOARD_SCHEMA_VERSION);
    const card = board.cards[0];
    expect(card.startedAt).toBeNull();
    expect(card.dueAt).toBeNull();
    expect(card.checklist).toEqual([]);
    expect(card.comments).toEqual([]);
    // v1 fields untouched
    expect(card.csNumber).toBe("CS-01");
    expect(card.completedAt).toBe("2026-05-22T00:00:00.000Z");
    expect(card.labels).toEqual(["segurança"]);
  });

  it("is idempotent on v2 boards", () => {
    const once = migrateBoard({
      version: 1,
      lastUpdated: "2026-06-09T01:24:05.724Z",
      columns: [],
      cards: [v1Card()],
    });
    const twice = migrateBoard(once);
    expect(twice).toEqual(once);
  });

  it("preserves v2 fields already present", () => {
    const board = migrateBoard({
      version: 2,
      lastUpdated: "x",
      columns: [],
      cards: [v1Card({
        startedAt: "2026-07-01T12:00:00.000Z",
        checklist: [{ id: "c1", text: "step 1", done: true }],
        comments: [{ id: "m1", text: "note", createdAt: "2026-07-01T12:00:00.000Z", type: "comment" }],
      })],
    });
    expect(board.cards[0].startedAt).toBe("2026-07-01T12:00:00.000Z");
    expect(board.cards[0].checklist).toHaveLength(1);
    expect(board.cards[0].comments).toHaveLength(1);
  });

  it("migrates the real production board file without errors", () => {
    const raw = JSON.parse(
      readFileSync(path.join(process.cwd(), "docs", "cs-board.json"), "utf-8")
    );
    const board = migrateBoard(raw);
    expect(board.version).toBe(BOARD_SCHEMA_VERSION);
    expect(board.columns.length).toBeGreaterThan(0);
    expect(board.cards.length).toBeGreaterThan(0);
    for (const c of board.cards) {
      expect(Array.isArray(c.checklist)).toBe(true);
      expect(Array.isArray(c.comments)).toBe(true);
      expect(typeof c.order).toBe("number");
    }
  });
});

describe("withActivity", () => {
  it("appends an activity entry without touching existing comments", () => {
    const card = migrateBoard({ version: 1, lastUpdated: "x", columns: [], cards: [v1Card()] }).cards[0];
    const next = withActivity(card, 'Movida de "Backlog" para "Em andamento"');
    expect(next.comments).toHaveLength(1);
    expect(next.comments[0].type).toBe("activity");
    expect(next.comments[0].text).toContain("Em andamento");
    // original untouched (immutability)
    expect(card.comments).toHaveLength(0);
  });
});

describe("compareVersionsDesc", () => {
  it("orders newest release first", () => {
    const sorted = ["1.6.0", "1.14.1", "1.9.1", "1.14.0"].sort(compareVersionsDesc);
    expect(sorted).toEqual(["1.14.1", "1.14.0", "1.9.1", "1.6.0"]);
  });

  it("compares numerically, not lexicographically", () => {
    expect(compareVersionsDesc("1.9.0", "1.14.0")).toBeGreaterThan(0); // 1.14 is newer
  });

  it("sorts non-parsable strings after parsable ones", () => {
    const sorted = ["abc", "1.2.0"].sort(compareVersionsDesc);
    expect(sorted).toEqual(["1.2.0", "abc"]);
  });
});

describe("groupByRelease", () => {
  const mk = (id: string, version: string) =>
    migrateBoard({ version: 1, lastUpdated: "x", columns: [], cards: [v1Card({ id, version })] }).cards[0];

  it("puts the versionless (Em aberto) group first, then releases newest-first", () => {
    const groups = groupByRelease([
      mk("a", "1.6.0"), mk("b", "1.14.1"), mk("c", ""), mk("d", "1.14.1"),
    ]);
    expect(groups.map(g => g.release)).toEqual(["", "1.14.1", "1.6.0"]);
    expect(groups[0].cards.map(c => c.id)).toEqual(["c"]); // Em aberto on top
    expect(groups[1].cards.map(c => c.id)).toEqual(["b", "d"]); // input order kept
  });

  it("returns an empty array for no cards", () => {
    expect(groupByRelease([])).toEqual([]);
  });
});

describe("isLocalColumn", () => {
  it("recognises the editable pre-PR columns", () => {
    expect(isLocalColumn("backlog")).toBe(true);
    expect(isLocalColumn("blocked")).toBe(true);
    expect(isLocalColumn("in-progress")).toBe(true);
  });
  it("rejects git-owned and unknown columns", () => {
    expect(isLocalColumn("done")).toBe(false);
    expect(isLocalColumn("review")).toBe(false);
    expect(isLocalColumn("")).toBe(false);
  });
});

describe("assembleBoard", () => {
  const mkCard = (id: string, columnId: string, csNumber: string, version = ""): KanbanCard =>
    migrateBoard({ version: 1, lastUpdated: "x", columns: [], cards: [v1Card({ id, columnId, csNumber, version })] }).cards[0];

  const gitBoard = (cards: KanbanCard[]): KanbanBoard => ({
    version: 2,
    lastUpdated: "2026-07-19T00:00:00.000Z",
    columns: [
      { id: "backlog",     title: "Backlog",      order: 0 },
      { id: "in-progress", title: "Em andamento", order: 1 },
      { id: "done",        title: "Concluídas",   order: 3 },
    ],
    cards,
  });

  it("merges local pre-PR cards with the git done archive", () => {
    const git = gitBoard([mkCard("cs-49", "done", "CS-49", "1.16.0")]);
    const local = [mkCard("cs-77", "backlog", "CS-77"), mkCard("cs-78", "in-progress", "CS-78")];
    const board = assembleBoard(git, local);
    const ids = board.cards.map(c => c.csNumber).sort();
    expect(ids).toEqual(["CS-49", "CS-77", "CS-78"]);
    // columns come from the git board (plus the synthetic Revisão column)
    expect(board.columns.map(c => c.id)).toEqual(
      expect.arrayContaining(git.columns.map(c => c.id))
    );
  });

  it("git wins: a promoted CS drops its lingering local copy", () => {
    const git = gitBoard([mkCard("cs-73", "done", "CS-73", "1.16.0")]);
    const local = [mkCard("cs-73-local", "in-progress", "CS-73"), mkCard("cs-77", "backlog", "CS-77")];
    const board = assembleBoard(git, local);
    const cs73 = board.cards.filter(c => c.csNumber === "CS-73");
    expect(cs73).toHaveLength(1);
    expect(cs73[0].columnId).toBe("done"); // the git copy, not the local one
    expect(board.cards.map(c => c.csNumber).sort()).toEqual(["CS-73", "CS-77"]);
  });

  it("ignores non-local cards that leak into the local list", () => {
    const git = gitBoard([]);
    // a stray 'done' card in the local source must not be rendered as local
    const local = [mkCard("cs-x", "done", "CS-X"), mkCard("cs-77", "backlog", "CS-77")];
    const board = assembleBoard(git, local);
    expect(board.cards.map(c => c.csNumber)).toEqual(["CS-77"]);
  });

  /* ── phase B: open PRs → Revisão ── */

  it("projects a local card into Revisão when its CS has an open PR", () => {
    const git = gitBoard([]);
    const local = [mkCard("cs-77", "in-progress", "CS-77"), mkCard("cs-78", "backlog", "CS-78")];
    const board = assembleBoard(git, local, [{ csNumber: "CS-77", prNumber: 40, title: "feat: x (CS-77)" }]);

    const cs77 = board.cards.find(c => c.csNumber === "CS-77")!;
    expect(cs77.columnId).toBe(REVIEW_COLUMN_ID);
    expect(cs77.prNumber).toBe(40);
    expect(cs77.title).toBe("Sign session cookie"); // local card's data survives the projection
    // CS-78 stays local; no duplicate CS-77 remains in a local column
    expect(board.cards.filter(c => c.csNumber === "CS-77")).toHaveLength(1);
    expect(board.cards.find(c => c.csNumber === "CS-78")!.columnId).toBe("backlog");
  });

  it("synthesizes a Revisão card from the PR when no local card exists", () => {
    const board = assembleBoard(gitBoard([]), [], [{ csNumber: "CS-80", prNumber: 41, title: "fix: y (CS-80)" }]);
    const c = board.cards.find(x => x.csNumber === "CS-80")!;
    expect(c.columnId).toBe(REVIEW_COLUMN_ID);
    expect(c.prNumber).toBe(41);
  });

  it("main outranks an open PR: a merged CS never shows in Revisão", () => {
    const git = gitBoard([mkCard("cs-77", "done", "CS-77", "1.16.0")]);
    const board = assembleBoard(git, [], [{ csNumber: "CS-77", prNumber: 40, title: "..." }]);
    const cs77 = board.cards.filter(c => c.csNumber === "CS-77");
    expect(cs77).toHaveLength(1);
    expect(cs77[0].columnId).toBe("done");
  });

  it("appends the synthetic Revisão column between Bloqueado and Concluídas", () => {
    const board = assembleBoard(gitBoard([]), []);
    const ids = [...board.columns].sort((a, b) => a.order - b.order).map(c => c.id);
    expect(ids.indexOf("review")).toBeGreaterThan(ids.indexOf("in-progress"));
    expect(ids.indexOf("review")).toBeLessThan(ids.indexOf("done"));
  });

  it("splices local satellite annotations onto the locked done card (decision a)", () => {
    const git = gitBoard([mkCard("cs-73", "done", "CS-73", "1.16.0")]);
    const satellite = {
      ...mkCard("cs-73-sat", "in-progress", "CS-73"),
      checklist: [{ id: "c1", text: "spec written", done: true }],
      comments: [{ id: "m1", text: "planning note", createdAt: "2026-07-01T00:00:00.000Z", type: "comment" as const }],
    };
    const board = assembleBoard(git, [satellite]);
    const done = board.cards.find(c => c.csNumber === "CS-73")!;
    expect(done.columnId).toBe("done");           // git owns position
    expect(done.checklist).toHaveLength(1);        // annotations flow in
    expect(done.comments[0].text).toBe("planning note");
  });
});

describe("resolveCsNumber", () => {
  it("prefers the PR title over the branch", () => {
    expect(resolveCsNumber("feat(studio): x (CS-76)", "feature/99-other")).toBe("CS-76");
  });
  it("falls back to the branch prefix", () => {
    expect(resolveCsNumber("feat: no cs here", "feature/72-assisted-mode")).toBe("CS-72");
  });
  it("keeps letter suffixes lowercase (board convention)", () => {
    expect(resolveCsNumber("fix: z (CS-37B)", "")).toBe("CS-37b");
    expect(resolveCsNumber("", "fix/37b-password-reset")).toBe("CS-37b");
  });
  it("returns null when nothing matches", () => {
    expect(resolveCsNumber("chore: bump deps", "chore/bump-deps")).toBeNull();
  });
});

describe("daysUntil", () => {
  const now = new Date("2026-07-07T15:30:00");

  it("returns 0 for today regardless of time", () => {
    expect(daysUntil("2026-07-07T23:59:00", now)).toBe(0);
  });

  it("returns positive days for future dates", () => {
    expect(daysUntil("2026-07-10T08:00:00", now)).toBe(3);
  });

  it("returns negative days for overdue dates", () => {
    expect(daysUntil("2026-07-05T08:00:00", now)).toBe(-2);
  });
});

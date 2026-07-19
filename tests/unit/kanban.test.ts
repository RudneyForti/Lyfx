import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import {
  migrateBoard,
  withActivity,
  compareVersionsDesc,
  groupByRelease,
  daysUntil,
  BOARD_SCHEMA_VERSION,
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

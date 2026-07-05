import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

/**
 * Alert engine + notifications — real Postgres.
 * Covers danger condition detection (budget blown, critical liability),
 * fingerprint deduplication in syncDangerAlerts, and the unread badge
 * counting only manual notifications.
 */

let currentUserId = "";
vi.mock("@/lib/session", () => ({
  requireAuth: vi.fn(async () => {
    if (!currentUserId) throw new Error("Unauthenticated");
    return currentUserId;
  }),
  requireSession: vi.fn(async () => ({ userId: currentUserId, sessionId: "test" })),
  getSessionUserId: vi.fn(async () => currentUserId || null),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { db } from "@/lib/db";
import { computeDangerConditions } from "@/lib/alert-engine";
import { getUnreadCount, markAllAsRead, syncDangerAlerts } from "@/app/actions/notifications";

const EMAIL = "alerts-judy@test.lyfx";
let judy = "";

async function cleanup() {
  const u = await db.user.findFirst({ where: { email: EMAIL }, select: { id: true } });
  if (u) {
    await db.notification.deleteMany({ where: { userId: u.id } });
    await db.transaction.deleteMany({ where: { userId: u.id } });
    await db.budget.deleteMany({ where: { userId: u.id } });
    await db.liability.deleteMany({ where: { userId: u.id } });
    await db.user.delete({ where: { id: u.id } });
  }
}

beforeAll(async () => {
  await cleanup();
  judy = (await db.user.create({ data: { name: "Judy", email: EMAIL, password: "x" } })).id;
  currentUserId = judy;

  const now = new Date();
  const midMonth = new Date(now.getFullYear(), now.getMonth(), 15);

  // Budget 100 blown by a 150 debit this month → danger condition
  await db.budget.create({ data: { userId: judy, category: "debit_variable", amount: 100 } });
  await db.transaction.create({
    data: {
      userId: judy, date: midMonth, description: "Blowout", amount: 150,
      type: "debit", category: "debit_variable",
    },
  });

  // Critical liability with positive balance → danger condition
  await db.liability.create({
    data: {
      userId: judy, name: "Overdraft", type: "cheque_especial",
      currentBalance: 500, interestRate: 8, minimumPayment: 50,
    },
  });
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

describe("computeDangerConditions", () => {
  it("detects blown budget and critical liability, each with a stable fingerprint", async () => {
    const conditions = await computeDangerConditions(judy);
    const types = conditions.map((c) => c.type);
    expect(types).toContain("budget");
    expect(types).toContain("liability");
    for (const c of conditions) {
      expect(c.severity).toBe("danger");
      expect(c.fingerprint.length).toBeGreaterThan(0);
    }
  });

  it("returns nothing for a user with no data", async () => {
    const ghost = await db.user.create({ data: { name: "Ghost", email: "ghost@test.lyfx", password: "x" } });
    expect(await computeDangerConditions(ghost.id)).toHaveLength(0);
    await db.user.delete({ where: { id: ghost.id } });
  });
});

describe("syncDangerAlerts", () => {
  it("creates one notification per condition and deduplicates by fingerprint", async () => {
    await syncDangerAlerts(judy);
    const first = await db.notification.count({ where: { userId: judy, fingerprint: { not: null } } });
    expect(first).toBeGreaterThanOrEqual(2);

    await syncDangerAlerts(judy); // same conditions → no duplicates
    const second = await db.notification.count({ where: { userId: judy, fingerprint: { not: null } } });
    expect(second).toBe(first);
  });
});

describe("unread badge", () => {
  it("counts only manual notifications (fingerprint null), and markAllAsRead zeroes it", async () => {
    expect(await getUnreadCount()).toBe(0); // danger alerts don't inflate the badge

    await db.notification.create({
      data: { userId: judy, title: "Welcome", body: "Hello", type: "info", fingerprint: null },
    });
    expect(await getUnreadCount()).toBe(1);

    await markAllAsRead();
    expect(await getUnreadCount()).toBe(0);
  });
});

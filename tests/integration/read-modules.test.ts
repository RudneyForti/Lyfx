import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

/**
 * Read/aggregation modules — reports, projections, health, dashboard,
 * education. Real Postgres; only the session layer is mocked.
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
import { getReports } from "@/app/actions/reports";
import { getHealthData } from "@/app/actions/health";
import { getDashboardData } from "@/app/actions/dashboard";
import { getPillProgress, completePill, getStreakData } from "@/app/actions/education";

const EMAILS = ["read-kate@test.lyfx", "read-liam@test.lyfx"];
let kate = "";
let liam = "";
const now = new Date();
const M = now.getMonth() + 1;
const Y = now.getFullYear();
const midMonth = new Date(Y, M - 1, 15);

async function cleanup() {
  const users = await db.user.findMany({ where: { email: { in: EMAILS } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (ids.length) {
    await db.transaction.deleteMany({ where: { userId: { in: ids } } });
    await db.settings.deleteMany({ where: { userId: { in: ids } } });
    await db.pillProgress.deleteMany({ where: { userId: { in: ids } } });
    await db.tag.deleteMany({ where: { userId: { in: ids } } });
    await db.goal.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
  }
}

beforeAll(async () => {
  await cleanup();
  kate = (await db.user.create({ data: { name: "Kate", email: EMAILS[0], password: "x" } })).id;
  liam = (await db.user.create({ data: { name: "Liam", email: EMAILS[1], password: "x" } })).id;

  // Kate: income 4000 + expenses 1000 (personal) / 500 (professional) this month
  await db.transaction.createMany({
    data: [
      { userId: kate, date: midMonth, description: "Salary", amount: 4000, type: "credit", category: "credit_fixed", context: "personal" },
      { userId: kate, date: midMonth, description: "Rent",   amount: 1000, type: "debit",  category: "debit_fixed", context: "personal" },
      { userId: kate, date: midMonth, description: "Tools",  amount: 500,  type: "debit",  category: "debit_variable", context: "professional" },
    ],
  });
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

describe("reports", () => {
  it("aggregates income/expense per month and splits by context", async () => {
    currentUserId = kate;
    const r = await getReports(3);

    expect(r.months).toHaveLength(3);
    const current = r.months[r.months.length - 1];
    expect(current.income).toBe(4000);
    expect(current.expense).toBe(1500);

    expect(r.totalIncome).toBe(4000);
    expect(r.totalExpense).toBe(1500);
    expect(r.contextBreakdown.personal.expense).toBe(1000);
    expect(r.contextBreakdown.professional.expense).toBe(500);
  });

  it("is isolated per user", async () => {
    currentUserId = liam;
    const r = await getReports(3);
    expect(r.totalIncome).toBe(0);
    expect(r.totalExpense).toBe(0);
  });
});

describe("health", () => {
  it("computes a bounded health score and reserve months from settings", async () => {
    currentUserId = kate;
    await db.settings.create({ data: { userId: kate, reserveBalance: 3000 } });

    const h = await getHealthData(M, Y);
    expect(h.summary.credits.total).toBe(4000);
    expect(h.summary.debits.total).toBe(1500);
    expect(h.healthScore.total).toBeGreaterThanOrEqual(0);
    expect(h.healthScore.total).toBeLessThanOrEqual(100);
    expect(h.healthScore.profile).toBeTruthy();
    expect(h.reserveBalance).toBe(3000);
  });
});

describe("dashboard", () => {
  it("returns the full aggregate for the month with a 6-slot trend", async () => {
    currentUserId = kate;
    const d = await getDashboardData(M, Y);

    expect(d.summary.credits.total).toBe(4000);
    expect(d.transactions.length).toBeGreaterThanOrEqual(3);
    expect(d.trend).toHaveLength(6);
    const currentSlot = d.trend[5];
    expect(currentSlot.isCurrent).toBe(true);
    expect(currentSlot.income).toBe(4000);   // groupBy aggregation path
    expect(currentSlot.expense).toBe(1500);
  });
});

describe("education", () => {
  it("completePill records once and is idempotent", async () => {
    currentUserId = kate;
    const first = await completePill({ pillId: "pill-01", profile: "builder", timeSpentSeconds: 90, quizCorrect: true });
    expect(first.alreadyCompleted).toBe(false);

    const again = await completePill({ pillId: "pill-01", profile: "builder", timeSpentSeconds: 10, quizCorrect: false });
    expect(again.alreadyCompleted).toBe(true);

    const progress = await getPillProgress();
    expect(progress).toHaveLength(1);
    expect(progress[0].timeSpentSeconds).toBe(90); // first record preserved
  });

  it("streak counts today and progress is isolated per user", async () => {
    currentUserId = kate;
    const streak = await getStreakData();
    expect(streak.currentStreak).toBeGreaterThanOrEqual(1);

    currentUserId = liam;
    expect(await getPillProgress()).toHaveLength(0);
  });
});

import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

/**
 * Regression — month boundary bug: a transaction created via form date
 * "YYYY-MM-01" must appear in that month's queries. Before the fix,
 * new Date("YYYY-MM-01") parsed as UTC midnight → previous day in UTC-3 →
 * the transaction silently fell into the previous month.
 */

let currentUserId = "";
vi.mock("@/lib/session", () => ({
  requireAuth: vi.fn(async () => currentUserId),
  requireSession: vi.fn(async () => ({ userId: currentUserId, sessionId: "test" })),
  getSessionUserId: vi.fn(async () => currentUserId || null),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { db } from "@/lib/db";
import { createTransaction, getTransactions, getDRESummary } from "@/app/actions/transactions";

const EMAIL = "boundary-eve@test.lyfx";

async function cleanup() {
  const u = await db.user.findFirst({ where: { email: EMAIL }, select: { id: true } });
  if (u) {
    await db.transaction.deleteMany({ where: { userId: u.id } });
    await db.user.delete({ where: { id: u.id } });
  }
}

beforeAll(async () => {
  await cleanup();
  currentUserId = (await db.user.create({ data: { name: "Eve", email: EMAIL, password: "x" } })).id;
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

describe("month boundary", () => {
  it("a transaction dated on day 1 belongs to that month, not the previous one", async () => {
    await createTransaction({
      date: "2026-09-01", // first day of September
      description: "Day-one salary",
      amount: 1000,
      type: "credit",
      category: "credit_fixed",
    });

    const september = await getTransactions({ month: 9, year: 2026 });
    expect(september).toHaveLength(1);
    expect(september[0].date.getMonth()).toBe(8); // September, local

    const august = await getTransactions({ month: 8, year: 2026 });
    expect(august).toHaveLength(0); // the old bug put it here

    const dre = await getDRESummary(9, 2026);
    expect(dre.credits.total).toBe(1000);
  });

  it("a transaction dated on the last day of a month stays in that month", async () => {
    await createTransaction({
      date: "2026-09-30",
      description: "Month-end expense",
      amount: 50,
      type: "debit",
      category: "debit_variable",
    });

    const september = await getTransactions({ month: 9, year: 2026 });
    expect(september).toHaveLength(2);
    const october = await getTransactions({ month: 10, year: 2026 });
    expect(october).toHaveLength(0);
  });
});

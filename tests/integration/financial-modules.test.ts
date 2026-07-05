import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

/**
 * Financial modules integration tests — real Prisma + lyfx_test database.
 * Covers budgets (upsert semantics + isolation), goals (payment plan
 * generation math, past-deadline rejection, payment marking) and the
 * DRE summary aggregation.
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
import { getBudgets, setBudget, deleteBudget } from "@/app/actions/budgets";
import { getGoals, createGoal, markPayment } from "@/app/actions/goals";
import { createTransaction, getDRESummary } from "@/app/actions/transactions";

const EMAILS = ["fin-carol@test.lyfx", "fin-dave@test.lyfx"];
let carol = "";
let dave = "";

async function cleanup() {
  const users = await db.user.findMany({ where: { email: { in: EMAILS } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (ids.length) {
    await db.transaction.deleteMany({ where: { userId: { in: ids } } });
    await db.budget.deleteMany({ where: { userId: { in: ids } } });
    await db.goal.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
  }
}

beforeAll(async () => {
  await cleanup();
  carol = (await db.user.create({ data: { name: "Carol", email: EMAILS[0], password: "x" } })).id;
  dave  = (await db.user.create({ data: { name: "Dave",  email: EMAILS[1], password: "x" } })).id;
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

describe("budgets", () => {
  it("setBudget creates and then updates the same category (upsert)", async () => {
    currentUserId = carol;
    const created = await setBudget("debit_variable", 500);
    expect(created.amount).toBe(500);

    const updated = await setBudget("debit_variable", 750);
    expect(updated.amount).toBe(750);
    expect(updated.id).toBe(created.id); // same row — no duplicate per category

    expect(await getBudgets()).toHaveLength(1);
  });

  it("budgets are isolated between users", async () => {
    currentUserId = dave;
    expect(await getBudgets()).toHaveLength(0);
  });

  it("deleteBudget removes only the caller's budget", async () => {
    currentUserId = carol;
    await deleteBudget("debit_variable");
    expect(await getBudgets()).toHaveLength(0);
  });
});

describe("goals", () => {
  it("rejects a deadline in the past", async () => {
    currentUserId = carol;
    const result = await createGoal({
      name: "Time machine",
      targetAmount: 1000,
      deadline: "2020-01-15",
      color: "#22D3EE",
      icon: "target",
    });
    expect(result).toHaveProperty("error");
  });

  it("generates a payment plan whose sum equals the target exactly", async () => {
    currentUserId = carol;
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 7); // 7 months from now
    const result = await createGoal({
      name: "Trip fund",
      targetAmount: 1000, // 1000/7 = 142.85… — rounding residual goes to last payment
      deadline: deadline.toISOString(),
      color: "#22D3EE",
      icon: "target",
    });
    expect(result).not.toHaveProperty("error");

    const [goal] = await getGoals();
    expect(goal.payments.length).toBeGreaterThanOrEqual(6);
    const total = goal.payments.reduce((s, p) => s + p.amount, 0);
    expect(total).toBe(1000); // last payment absorbs the residual
  });

  it("markPayment updates currentAmount; goal completes when target is reached", async () => {
    currentUserId = carol;
    const [goal] = await getGoals();

    await markPayment(goal.payments[0].id, true);
    let [after] = await getGoals();
    expect(after.currentAmount).toBe(goal.payments[0].amount);
    expect(after.status).toBe("active");

    for (const p of goal.payments.slice(1)) await markPayment(p.id, true);
    [after] = await getGoals();
    expect(after.currentAmount).toBe(1000);
    expect(after.status).toBe("completed");
  });

  it("goals are isolated between users and cross-user markPayment is rejected", async () => {
    currentUserId = dave;
    expect(await getGoals()).toHaveLength(0);

    currentUserId = carol;
    const [goal] = await getGoals();
    currentUserId = dave;
    await expect(markPayment(goal.payments[0].id, false)).rejects.toThrow();
  });
});

describe("DRE summary", () => {
  it("aggregates credits and debits of the month per user", async () => {
    currentUserId = carol;
    const now = new Date();
    // Mid-month date avoids UTC/local boundary ambiguity
    const midMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15`;

    await createTransaction({ date: midMonth, description: "Salary", amount: 3000, type: "credit", category: "credit_fixed" });
    await createTransaction({ date: midMonth, description: "Rent",   amount: 1200, type: "debit",  category: "debit_fixed" });
    await createTransaction({ date: midMonth, description: "Food",   amount: 300,  type: "debit",  category: "debit_variable" });

    const dre = await getDRESummary(now.getMonth() + 1, now.getFullYear());
    expect(dre.credits.total).toBe(3000);
    expect(dre.credits.fixed).toBe(3000);
    expect(dre.debits.total).toBe(1500);
    expect(dre.debits.fixed).toBe(1200);
    expect(dre.debits.variable).toBe(300);

    currentUserId = dave;
    const daveDre = await getDRESummary(now.getMonth() + 1, now.getFullYear());
    expect(daveDre.credits.total).toBe(0);
    expect(daveDre.debits.total).toBe(0);
  });
});

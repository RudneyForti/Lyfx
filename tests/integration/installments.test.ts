import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

/**
 * Installments system + transaction updates + reimbursables — the last
 * uncovered block of transactions.ts. Real Postgres.
 *
 * Core invariants:
 *  - the sum of all installments equals totalAmount exactly (CS-03:
 *    floor on n-1 installments, last one absorbs the rounding residual)
 *  - installments share a groupId and are numbered i/count
 *  - updateFutureInstallments touches only rows dated today or later
 *  - deleteInstallmentGroup removes the whole group, scoped by user
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
import {
  createInstallments,
  updateFutureInstallments,
  deleteInstallmentGroup,
  updateTransaction,
  getTransactions,
  getReimbursables,
  markReimbursed,
  unmarkReimbursed,
  createTransaction,
} from "@/app/actions/transactions";

const EMAILS = ["inst-mia@test.lyfx", "inst-noah@test.lyfx"];
let mia = "";
let noah = "";

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function cleanup() {
  const users = await db.user.findMany({ where: { email: { in: EMAILS } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (ids.length) {
    await db.transaction.deleteMany({ where: { userId: { in: ids } } });
    await db.tag.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
  }
}

beforeAll(async () => {
  await cleanup();
  mia  = (await db.user.create({ data: { name: "Mia",  email: EMAILS[0], password: "x" } })).id;
  noah = (await db.user.create({ data: { name: "Noah", email: EMAILS[1], password: "x" } })).id;
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

describe("createInstallments", () => {
  it("creates numbered installments whose sum equals totalAmount exactly", async () => {
    currentUserId = mia;
    // R$ 1000 / 3 = 333.33... → 333.33 + 333.33 + 333.34
    const start = new Date();
    start.setMonth(start.getMonth() - 1); // starts last month → 1 past, 2 future
    await createInstallments({
      firstDate: ymd(start),
      description: "Notebook",
      totalAmount: 1000,
      count: 3,
      type: "debit",
      category: "debit_committed",
    });

    const rows = await db.transaction.findMany({
      where: { userId: mia, description: { startsWith: "Notebook" } },
      orderBy: { installmentNumber: "asc" },
    });
    expect(rows).toHaveLength(3);

    const groupId = rows[0].installmentGroupId;
    expect(groupId).toBeTruthy();
    expect(rows.every((r) => r.installmentGroupId === groupId)).toBe(true);
    expect(rows.map((r) => r.description)).toEqual([
      "Notebook (1/3)", "Notebook (2/3)", "Notebook (3/3)",
    ]);

    const total = rows.reduce((s, r) => s + r.amount, 0);
    expect(total).toBeCloseTo(1000, 10); // exact sum — residual on the last one
    expect(rows[2].amount).toBeCloseTo(333.34, 2);

    // Monthly progression: each installment one month after the previous
    expect(rows[1].date.getMonth()).toBe((rows[0].date.getMonth() + 1) % 12);
  });
});

describe("updateFutureInstallments", () => {
  it("renames and reprices only installments dated today or later", async () => {
    currentUserId = mia;
    const [row] = await db.transaction.findMany({ where: { userId: mia }, take: 1 });
    const groupId = row.installmentGroupId!;

    await updateFutureInstallments(groupId, {
      baseDescription: "Notebook Pro",
      amount: 400,
      type: "debit",
      category: "debit_committed",
    });

    const rows = await db.transaction.findMany({
      where: { installmentGroupId: groupId },
      orderBy: { installmentNumber: "asc" },
    });

    // Installment 1 is in the past — untouched
    expect(rows[0].description).toBe("Notebook (1/3)");
    expect(rows[0].amount).toBeCloseTo(333.33, 2);
    // Installments 2 and 3 are future — renamed keeping their numbering
    expect(rows[1].description).toBe("Notebook Pro (2/3)");
    expect(rows[1].amount).toBe(400);
    expect(rows[2].description).toBe("Notebook Pro (3/3)");
    expect(rows[2].amount).toBe(400);
  });

  it("is a no-op for another user's group", async () => {
    currentUserId = mia;
    const [row] = await db.transaction.findMany({ where: { userId: mia }, take: 1 });
    const groupId = row.installmentGroupId!;

    currentUserId = noah;
    await updateFutureInstallments(groupId, {
      baseDescription: "Hijacked",
      amount: 1,
      type: "debit",
      category: "debit_variable",
    });

    const rows = await db.transaction.findMany({ where: { installmentGroupId: groupId } });
    expect(rows.some((r) => r.description.startsWith("Hijacked"))).toBe(false);
  });
});

describe("deleteInstallmentGroup", () => {
  it("removes the entire group for the owner only", async () => {
    currentUserId = mia;
    const [row] = await db.transaction.findMany({ where: { userId: mia }, take: 1 });
    const groupId = row.installmentGroupId!;

    currentUserId = noah;
    await deleteInstallmentGroup(groupId); // scoped → no-op
    expect(await db.transaction.count({ where: { installmentGroupId: groupId } })).toBe(3);

    currentUserId = mia;
    const result = await deleteInstallmentGroup(groupId);
    expect(result).toEqual({ ok: true });
    expect(await db.transaction.count({ where: { installmentGroupId: groupId } })).toBe(0);
  });
});

describe("updateTransaction", () => {
  it("updates own transaction fields; foreign update fails", async () => {
    currentUserId = mia;
    const now = new Date();
    await createTransaction({
      date: ymd(now), description: "Cinema", amount: 50,
      type: "debit", category: "debit_variable",
    });
    const [tx] = await getTransactions();

    const ok = await updateTransaction(tx.id, {
      date: ymd(now), description: "Cinema IMAX", amount: 75,
      type: "debit", category: "debit_intentional",
    });
    expect(ok).toEqual({ ok: true });

    const [updated] = await getTransactions();
    expect(updated.description).toBe("Cinema IMAX");
    expect(updated.amount).toBe(75);
    expect(updated.category).toBe("debit_intentional");

    currentUserId = noah;
    const foreign = await updateTransaction(tx.id, {
      date: ymd(now), description: "Stolen", amount: 1,
      type: "debit", category: "debit_variable",
    });
    expect(foreign).toHaveProperty("error"); // update where {id,userId} → not found

    currentUserId = mia;
    expect((await getTransactions())[0].description).toBe("Cinema IMAX");
  });
});

describe("reimbursables", () => {
  it("lists only reimbursable transactions and toggles reimbursedAt", async () => {
    currentUserId = mia;
    const now = new Date();
    await createTransaction({
      date: ymd(now), description: "Client lunch", amount: 120,
      type: "debit", category: "debit_variable", reimbursable: true,
    });

    const list = await getReimbursables();
    expect(list).toHaveLength(1);
    expect(list[0].description).toBe("Client lunch");
    expect(list[0].reimbursedAt).toBeNull();

    await markReimbursed(list[0].id);
    expect((await getReimbursables())[0].reimbursedAt).not.toBeNull();

    await unmarkReimbursed(list[0].id);
    expect((await getReimbursables())[0].reimbursedAt).toBeNull();

    currentUserId = noah;
    expect(await getReimbursables()).toHaveLength(0);
  });
});

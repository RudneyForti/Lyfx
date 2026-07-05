import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

/**
 * Data isolation integration tests — LC critical requirement.
 *
 * Real Prisma client + real Postgres (lyfx_test). Only the session layer is
 * mocked: `currentUserId` switches the authenticated user, exactly as two
 * different browsers would. Every action must scope reads and writes to the
 * authenticated user — cross-user leakage here is a CRITICAL defect.
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
  createTransaction,
  getTransactions,
  deleteTransaction,
} from "@/app/actions/transactions";

const EMAILS = ["iso-alice@test.lyfx", "iso-bob@test.lyfx"];
let alice = "";
let bob = "";

async function cleanup() {
  const users = await db.user.findMany({ where: { email: { in: EMAILS } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (ids.length) {
    await db.transaction.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
  }
}

beforeAll(async () => {
  await cleanup();
  alice = (await db.user.create({ data: { name: "Alice", email: EMAILS[0], password: "x" } })).id;
  bob   = (await db.user.create({ data: { name: "Bob",   email: EMAILS[1], password: "x" } })).id;
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

describe("transaction isolation between users", () => {
  it("a transaction created by Alice is invisible to Bob", async () => {
    currentUserId = alice;
    const created = await createTransaction({
      date: "2026-07-01",
      description: "Alice salary",
      amount: 2500,
      type: "credit",
      category: "credit_fixed",
    });
    expect(created).toEqual({ ok: true });

    const aliceSees = await getTransactions();
    expect(aliceSees).toHaveLength(1);
    expect(aliceSees[0].description).toBe("Alice salary");

    currentUserId = bob;
    const bobSees = await getTransactions();
    expect(bobSees).toHaveLength(0);
  });

  it("Bob cannot delete Alice's transaction by id", async () => {
    currentUserId = alice;
    const [tx] = await getTransactions();
    expect(tx).toBeDefined();

    currentUserId = bob;
    const result = await deleteTransaction(tx.id); // deleteMany scoped by userId → no-op
    expect(result).toEqual({ ok: true });

    currentUserId = alice;
    const stillThere = await getTransactions();
    expect(stillThere).toHaveLength(1);
  });

  it("Alice can delete her own transaction", async () => {
    currentUserId = alice;
    const [tx] = await getTransactions();
    const result = await deleteTransaction(tx.id);
    expect(result).toEqual({ ok: true });
    expect(await getTransactions()).toHaveLength(0);
  });

  it("unauthenticated calls are rejected", async () => {
    currentUserId = "";
    const result = await createTransaction({
      date: "2026-07-01",
      description: "ghost",
      amount: 1,
      type: "debit",
      category: "debit_variable",
    });
    expect(result).toHaveProperty("error");
  });
});

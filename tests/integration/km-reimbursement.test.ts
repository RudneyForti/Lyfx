import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

/**
 * Reembolso Especial — integration tests on real Postgres.
 * Covers the densest business logic in the project: weighted fuel average,
 * dominant-fuel rate selection, submit → credit Transaction with D+N
 * business days, reopen → transaction removal, and user isolation.
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
// Holidays mocked empty — D+5 counts weekends only, deterministic
vi.mock("@/lib/holidays", () => ({ getHolidays: vi.fn(async () => new Set<string>()) }));

import { db } from "@/lib/db";
import {
  getKmConfig,
  createKmPeriod,
  getKmPeriod,
  createKmRoute,
  createKmReceipt,
  createKmExpense,
  submitPeriod,
  reopenPeriod,
  getKmPeriods,
} from "@/app/actions/km-reimbursement";

const EMAILS = ["km-frank@test.lyfx", "km-grace@test.lyfx"];
let frank = "";
let grace = "";
let periodId = "";

async function cleanup() {
  const users = await db.user.findMany({ where: { email: { in: EMAILS } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (ids.length) {
    await db.kmPeriod.deleteMany({ where: { userId: { in: ids } } }); // cascades routes/receipts/expenses
    await db.kmConfig.deleteMany({ where: { userId: { in: ids } } });
    await db.transaction.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
  }
}

beforeAll(async () => {
  await cleanup();
  frank = (await db.user.create({ data: { name: "Frank", email: EMAILS[0], password: "x" } })).id;
  grace = (await db.user.create({ data: { name: "Grace", email: EMAILS[1], password: "x" } })).id;
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

describe("period calculation", () => {
  it("creates config with documented defaults", async () => {
    currentUserId = frank;
    const config = await getKmConfig();
    expect(config.gasolineRate).toBe(0.25);
    expect(config.ethanolRate).toBe(0.36);
    expect(config.minFuelPct).toBe(0.15);
    expect(config.paymentDays).toBe(5);
  });

  it("computes weighted fuel average, rate/km and grand total", async () => {
    currentUserId = frank;
    ({ id: periodId } = await createKmPeriod({
      name: "July trip", startDate: "2026-07-01", endDate: "2026-07-31",
    }));

    // Routes: 100 km + 50 km = 150 km
    await createKmRoute({ periodId, date: "2026-07-10", origin: "A", destination: "B", km: 100 });
    await createKmRoute({ periodId, date: "2026-07-11", origin: "B", destination: "A", km: 50 });

    // Receipts (gasoline): 40 L × R$6.00 = 240 + 10 L × R$7.00 = 70 → avg 310/50 = 6.20
    await createKmReceipt({ periodId, date: "2026-07-10", fuelType: "gasoline", liters: 40, totalAmount: 240 });
    await createKmReceipt({ periodId, date: "2026-07-11", fuelType: "gasoline", liters: 10, totalAmount: 70 });

    // Extra expense
    await createKmExpense({ periodId, type: "toll", date: "2026-07-10", amount: 25.5 });

    const period = await getKmPeriod(periodId);
    expect(period!.totalKm).toBe(150);
    expect(period!.fuelPriceAvg).toBeCloseTo(6.2, 5);
    expect(period!.ratePerKm).toBeCloseTo(6.2 * 0.25, 5);       // gasoline dominant
    expect(period!.kmAmount).toBeCloseTo(150 * 6.2 * 0.25, 5);  // 232.50
    expect(period!.extraAmount).toBeCloseTo(25.5, 5);
    expect(period!.grandTotal).toBeCloseTo(232.5 + 25.5, 5);
  });

  it("switches the rate when ethanol becomes the dominant fuel", async () => {
    currentUserId = frank;
    // 60 L ethanol > 50 L gasoline → ethanol rate (0.36) applies
    await createKmReceipt({ periodId, date: "2026-07-12", fuelType: "ethanol", liters: 60, totalAmount: 300 });
    const period = await getKmPeriod(periodId);
    const expectedAvg = (240 + 70 + 300) / (40 + 10 + 60); // 610/110
    expect(period!.fuelPriceAvg).toBeCloseTo(expectedAvg, 5);
    expect(period!.ratePerKm).toBeCloseTo(expectedAvg * 0.36, 5);
  });
});

describe("submit and reopen", () => {
  it("submit creates a credit Transaction dated D+5 business days", async () => {
    currentUserId = frank;
    await submitPeriod(periodId);

    const period = await getKmPeriod(periodId);
    expect(period!.status).toBe("submitted");
    expect(period!.transactionId).toBeTruthy();
    expect(period!.expectedPayAt).toBeTruthy();

    // D+5 never lands on a weekend (holidays mocked empty)
    const payDay = period!.expectedPayAt!.getDay();
    expect(payDay).not.toBe(0);
    expect(payDay).not.toBe(6);

    const tx = await db.transaction.findUnique({ where: { id: period!.transactionId! } });
    expect(tx).not.toBeNull();
    expect(tx!.type).toBe("credit");
    expect(tx!.amount).toBeCloseTo(period!.grandTotal, 5);
    expect(tx!.userId).toBe(frank);
    expect(tx!.description).toContain("Reembolso Especial");
  });

  it("submit is idempotent — a submitted period cannot be re-submitted", async () => {
    currentUserId = frank;
    const before = await getKmPeriod(periodId);
    await submitPeriod(periodId); // no-op: status !== "open"
    const after = await getKmPeriod(periodId);
    expect(after!.transactionId).toBe(before!.transactionId);
  });

  it("reopen deletes the Transaction and resets the period", async () => {
    currentUserId = frank;
    const before = await getKmPeriod(periodId);
    const txId = before!.transactionId!;

    await reopenPeriod(periodId);

    const period = await getKmPeriod(periodId);
    expect(period!.status).toBe("open");
    expect(period!.transactionId).toBeNull();
    expect(period!.submittedAt).toBeNull();
    expect(period!.expectedPayAt).toBeNull();
    expect(await db.transaction.findUnique({ where: { id: txId } })).toBeNull();
  });
});

describe("isolation", () => {
  it("periods are invisible cross-user and cannot be submitted by another user", async () => {
    currentUserId = grace;
    expect(await getKmPeriods()).toHaveLength(0);
    expect(await getKmPeriod(periodId)).toBeNull();

    await submitPeriod(periodId); // scoped findUnique → no-op
    currentUserId = frank;
    expect((await getKmPeriod(periodId))!.status).toBe("open");
  });
});

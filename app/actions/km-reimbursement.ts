"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";

// ── Types ─────────────────────────────────────────────────────────────────────

export type KmConfigData = {
  id: string;
  userId: string;
  gasolineRate: number;
  ethanolRate: number;
  minFuelPct: number;
  paymentDays: number;
  vehiclePlate: string;
  vehicleType: string;
  vehicleBrand: string;
};

export type KmPeriodSummary = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  fuelType: string;
  status: string;
  submittedAt: Date | null;
  expectedPayAt: Date | null;
  totalKm: number;
  fuelPriceAvg: number;
  ratePerKm: number;
  kmAmount: number;
  extraAmount: number;
  grandTotal: number;
  notes: string | null;
  transactionId: string | null;
  createdAt: Date;
  _count: { routes: number; receipts: number; expenses: number };
};

export type KmPeriodDetail = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  fuelType: string;
  status: string;
  submittedAt: Date | null;
  expectedPayAt: Date | null;
  totalKm: number;
  fuelPriceAvg: number;
  ratePerKm: number;
  kmAmount: number;
  extraAmount: number;
  grandTotal: number;
  notes: string | null;
  transactionId: string | null;
  createdAt: Date;
  routes: KmRouteData[];
  receipts: KmReceiptData[];
  expenses: KmExpenseData[];
};

export type KmRouteData = {
  id: string;
  date: Date;
  origin: string;
  destination: string;
  km: number;
  notes: string | null;
  placeId: string | null;
  direction: string | null;
  createdAt: Date;
};

export type KmReceiptData = {
  id: string;
  date: Date;
  fuelType: string;
  liters: number;
  totalAmount: number;
  notes: string | null;
  createdAt: Date;
};

export type KmExpenseData = {
  id: string;
  type: string;
  date: Date;
  amount: number;
  notes: string | null;
  createdAt: Date;
};

export type KmPlaceData = {
  id: string;
  name: string;
  originAddress: string;
  destinationAddress: string;
  kmGoing: number;
  kmReturn: number;
  notes: string | null;
  createdAt: Date;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function addBusinessDays(date: Date, days: number): Date {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d;
}

async function recalcPeriodInternal(periodId: string, userId: string) {
  const [routes, receipts, expenses, config] = await Promise.all([
    db.kmRoute.findMany({ where: { periodId, userId } }),
    db.kmReceipt.findMany({ where: { periodId, userId } }),
    db.kmExpense.findMany({ where: { periodId, userId } }),
    db.kmConfig.findUnique({ where: { userId } }),
  ]);

  const period = await db.kmPeriod.findUnique({ where: { id: periodId, userId } });
  if (!period) return;

  const gasolineRate = config?.gasolineRate ?? 0.25;
  const ethanolRate  = config?.ethanolRate  ?? 0.36;
  // Derive dominant fuel from receipts (not period.fuelType)
  const gasolineL = receipts.filter(r => r.fuelType === "gasoline").reduce((s, r) => s + r.liters, 0);
  const ethanolL  = receipts.filter(r => r.fuelType === "ethanol").reduce((s, r) => s + r.liters, 0);
  const dominantFuel = ethanolL > gasolineL ? "ethanol" : "gasoline";
  const rate = dominantFuel === "ethanol" ? ethanolRate : gasolineRate;

  const totalKm    = routes.reduce((s, r) => s + r.km, 0);
  const totalLiters = receipts.reduce((s, r) => s + r.liters, 0);
  const totalFuelAmount = receipts.reduce((s, r) => s + r.totalAmount, 0);
  const fuelPriceAvg = totalLiters > 0 ? totalFuelAmount / totalLiters : 0;
  const ratePerKm   = fuelPriceAvg * rate;
  const kmAmount    = totalKm * ratePerKm;
  const extraAmount = expenses.reduce((s, e) => s + e.amount, 0);
  const grandTotal  = kmAmount + extraAmount;

  await db.kmPeriod.update({
    where: { id: periodId },
    data: { totalKm, fuelPriceAvg, ratePerKm, kmAmount, extraAmount, grandTotal },
  });
}

// ── Config ────────────────────────────────────────────────────────────────────

export async function getKmConfig(): Promise<KmConfigData> {
  const userId = await requireAuth();
  const existing = await db.kmConfig.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.kmConfig.create({
    data: {
      userId,
      gasolineRate: 0.25, ethanolRate: 0.36, minFuelPct: 0.15, paymentDays: 5,
      vehiclePlate: "", vehicleType: "Carro", vehicleBrand: "",
    },
  });
}

export async function saveKmConfig(data: {
  gasolineRate: number;
  ethanolRate: number;
  minFuelPct: number;
  paymentDays: number;
  vehiclePlate?: string;
  vehicleType?: string;
  vehicleBrand?: string;
}): Promise<void> {
  const userId = await requireAuth();
  const payload = {
    gasolineRate: data.gasolineRate,
    ethanolRate: data.ethanolRate,
    minFuelPct: data.minFuelPct,
    paymentDays: data.paymentDays,
    vehiclePlate: data.vehiclePlate ?? "",
    vehicleType: data.vehicleType ?? "Carro",
    vehicleBrand: data.vehicleBrand ?? "",
  };
  await db.kmConfig.upsert({
    where: { userId },
    create: { userId, ...payload },
    update: payload,
  });
  revalidatePath("/km-reimbursement");
}

// ── Períodos ──────────────────────────────────────────────────────────────────

export async function getKmPeriods(): Promise<KmPeriodSummary[]> {
  const userId = await requireAuth();
  return db.kmPeriod.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
    include: { _count: { select: { routes: true, receipts: true, expenses: true } } },
  });
}

export async function getKmPeriod(id: string): Promise<KmPeriodDetail | null> {
  const userId = await requireAuth();
  return db.kmPeriod.findUnique({
    where: { id, userId },
    include: {
      routes:   { orderBy: { date: "asc" } },
      receipts: { orderBy: { date: "asc" } },
      expenses: { orderBy: { date: "asc" } },
    },
  });
}

export async function createKmPeriod(data: {
  name: string;
  startDate: string;
  endDate: string;
  fuelType?: string;
  notes?: string;
}): Promise<{ id: string }> {
  const userId = await requireAuth();
  const period = await db.kmPeriod.create({
    data: {
      userId,
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      fuelType: data.fuelType ?? "gasoline",
      notes: data.notes ?? null,
    },
  });
  revalidatePath("/km-reimbursement");
  return { id: period.id };
}

export async function updateKmPeriod(id: string, data: {
  name: string;
  startDate: string;
  endDate: string;
  notes?: string;
}): Promise<void> {
  const userId = await requireAuth();
  const period = await db.kmPeriod.findUnique({ where: { id, userId } });
  if (!period) return;
  await db.kmPeriod.update({
    where: { id },
    data: {
      name: data.name.trim(),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      notes: data.notes?.trim() ?? null,
    },
  });
  revalidatePath("/km-reimbursement");
  revalidatePath(`/km-reimbursement/${id}`);
}

export async function deleteKmPeriod(id: string): Promise<void> {
  const userId = await requireAuth();
  const period = await db.kmPeriod.findUnique({ where: { id, userId } });
  if (!period) return;
  // Delete linked transaction if any
  if (period.transactionId) {
    await db.transaction.deleteMany({ where: { id: period.transactionId, userId } });
  }
  await db.kmPeriod.deleteMany({ where: { id, userId } });
  revalidatePath("/km-reimbursement");
}

// ── Trajetos ──────────────────────────────────────────────────────────────────

export async function createKmRoute(data: {
  periodId: string;
  date: string;
  origin: string;
  destination: string;
  km: number;
  notes?: string;
  placeId?: string;
  direction?: string;
}): Promise<void> {
  const userId = await requireAuth();
  await db.kmRoute.create({
    data: {
      userId,
      periodId: data.periodId,
      date: new Date(data.date),
      origin: data.origin,
      destination: data.destination,
      km: data.km,
      notes: data.notes ?? null,
      placeId: data.placeId ?? null,
      direction: data.direction ?? null,
    },
  });
  await recalcPeriodInternal(data.periodId, userId);
  revalidatePath(`/km-reimbursement/${data.periodId}`);
}

export async function createKmRoutesBulk(routes: Array<{
  periodId: string;
  date: string;
  origin: string;
  destination: string;
  km: number;
  notes?: string;
  placeId?: string;
  direction?: string;
}>): Promise<void> {
  if (routes.length === 0) return;
  const userId = await requireAuth();
  const periodId = routes[0].periodId;
  await db.kmRoute.createMany({
    data: routes.map(r => ({
      userId,
      periodId: r.periodId,
      date: new Date(r.date),
      origin: r.origin,
      destination: r.destination,
      km: r.km,
      notes: r.notes ?? null,
      placeId: r.placeId ?? null,
      direction: r.direction ?? null,
    })),
  });
  await recalcPeriodInternal(periodId, userId);
  revalidatePath(`/km-reimbursement/${periodId}`);
}

export async function updateKmRoute(id: string, data: {
  date: string;
  origin: string;
  destination: string;
  km: number;
  notes?: string;
}): Promise<void> {
  const userId = await requireAuth();
  const route = await db.kmRoute.findFirst({ where: { id, userId } });
  if (!route) return;
  await db.kmRoute.update({
    where: { id },
    data: {
      date: new Date(data.date),
      origin: data.origin,
      destination: data.destination,
      km: data.km,
      notes: data.notes ?? null,
      // preserve placeId/direction on update
    },
  });
  await recalcPeriodInternal(route.periodId, userId);
  revalidatePath(`/km-reimbursement/${route.periodId}`);
}

export async function deleteKmRoute(id: string): Promise<void> {
  const userId = await requireAuth();
  const route = await db.kmRoute.findFirst({ where: { id, userId } });
  if (!route) return;
  await db.kmRoute.deleteMany({ where: { id, userId } });
  await recalcPeriodInternal(route.periodId, userId);
  revalidatePath(`/km-reimbursement/${route.periodId}`);
}

// ── Notas de combustível ──────────────────────────────────────────────────────

export async function createKmReceipt(data: {
  periodId: string;
  date: string;
  fuelType: string;
  liters: number;
  totalAmount: number;
  notes?: string;
}): Promise<void> {
  const userId = await requireAuth();
  await db.kmReceipt.create({
    data: {
      userId,
      periodId: data.periodId,
      date: new Date(data.date),
      fuelType: data.fuelType,
      liters: data.liters,
      totalAmount: data.totalAmount,
      notes: data.notes ?? null,
    },
  });
  await recalcPeriodInternal(data.periodId, userId);
  revalidatePath(`/km-reimbursement/${data.periodId}`);
}

export async function updateKmReceipt(id: string, data: {
  date: string;
  fuelType: string;
  liters: number;
  totalAmount: number;
  notes?: string;
}): Promise<void> {
  const userId = await requireAuth();
  const receipt = await db.kmReceipt.findFirst({ where: { id, userId } });
  if (!receipt) return;
  await db.kmReceipt.update({
    where: { id },
    data: {
      date: new Date(data.date),
      fuelType: data.fuelType,
      liters: data.liters,
      totalAmount: data.totalAmount,
      notes: data.notes ?? null,
    },
  });
  await recalcPeriodInternal(receipt.periodId, userId);
  revalidatePath(`/km-reimbursement/${receipt.periodId}`);
}

export async function deleteKmReceipt(id: string): Promise<void> {
  const userId = await requireAuth();
  const receipt = await db.kmReceipt.findFirst({ where: { id, userId } });
  if (!receipt) return;
  await db.kmReceipt.deleteMany({ where: { id, userId } });
  await recalcPeriodInternal(receipt.periodId, userId);
  revalidatePath(`/km-reimbursement/${receipt.periodId}`);
}

// ── Despesas extras ───────────────────────────────────────────────────────────

export async function createKmExpense(data: {
  periodId: string;
  type: string;
  date: string;
  amount: number;
  notes?: string;
}): Promise<void> {
  const userId = await requireAuth();
  await db.kmExpense.create({
    data: {
      userId,
      periodId: data.periodId,
      type: data.type,
      date: new Date(data.date),
      amount: data.amount,
      notes: data.notes ?? null,
    },
  });
  await recalcPeriodInternal(data.periodId, userId);
  revalidatePath(`/km-reimbursement/${data.periodId}`);
}

export async function deleteKmExpense(id: string): Promise<void> {
  const userId = await requireAuth();
  const expense = await db.kmExpense.findFirst({ where: { id, userId } });
  if (!expense) return;
  await db.kmExpense.deleteMany({ where: { id, userId } });
  await recalcPeriodInternal(expense.periodId, userId);
  revalidatePath(`/km-reimbursement/${expense.periodId}`);
}

// ── Fluxo de envio ────────────────────────────────────────────────────────────

export async function submitPeriod(id: string): Promise<void> {
  const userId = await requireAuth();
  const [period, config] = await Promise.all([
    db.kmPeriod.findUnique({ where: { id, userId } }),
    db.kmConfig.findUnique({ where: { userId } }),
  ]);
  if (!period || period.status !== "open") return;

  const paymentDays = config?.paymentDays ?? 5;
  const submittedAt   = new Date();
  const expectedPayAt = addBusinessDays(submittedAt, paymentDays);

  const tx = await db.transaction.create({
    data: {
      userId,
      date: expectedPayAt,
      description: `Reembolso KM - ${period.name}`,
      amount: period.grandTotal,
      type: "credit",
      category: "credit_variable",
      context: "km_reimbursement",
    },
  });

  await db.kmPeriod.update({
    where: { id },
    data: {
      status: "submitted",
      submittedAt,
      expectedPayAt,
      transactionId: tx.id,
    },
  });

  revalidatePath("/km-reimbursement");
  revalidatePath(`/km-reimbursement/${id}`);
  revalidatePath("/transactions");
}

export async function reopenPeriod(id: string): Promise<void> {
  const userId = await requireAuth();
  const period = await db.kmPeriod.findUnique({ where: { id, userId } });
  if (!period || period.status !== "submitted") return;

  if (period.transactionId) {
    await db.transaction.deleteMany({ where: { id: period.transactionId, userId } });
  }

  await db.kmPeriod.update({
    where: { id },
    data: {
      status: "open",
      submittedAt: null,
      expectedPayAt: null,
      transactionId: null,
    },
  });

  revalidatePath("/km-reimbursement");
  revalidatePath(`/km-reimbursement/${id}`);
  revalidatePath("/transactions");
}

// ── Lugares cadastrados ───────────────────────────────────────────────────────

export async function getKmPlaces(): Promise<KmPlaceData[]> {
  const userId = await requireAuth();
  return db.kmPlace.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function createKmPlace(data: {
  name: string;
  originAddress: string;
  destinationAddress: string;
  kmGoing: number;
  kmReturn: number;
  notes?: string;
}): Promise<void> {
  const userId = await requireAuth();
  await db.kmPlace.create({
    data: {
      userId,
      name: data.name.trim(),
      originAddress: data.originAddress.trim(),
      destinationAddress: data.destinationAddress.trim(),
      kmGoing: data.kmGoing,
      kmReturn: data.kmReturn,
      notes: data.notes?.trim() ?? null,
    },
  });
  revalidatePath("/km-reimbursement/settings");
  revalidatePath("/km-reimbursement");
}

export async function updateKmPlace(id: string, data: {
  name: string;
  originAddress: string;
  destinationAddress: string;
  kmGoing: number;
  kmReturn: number;
  notes?: string;
}): Promise<void> {
  const userId = await requireAuth();
  const place = await db.kmPlace.findFirst({ where: { id, userId } });
  if (!place) return;
  await db.kmPlace.update({
    where: { id },
    data: {
      name: data.name.trim(),
      originAddress: data.originAddress.trim(),
      destinationAddress: data.destinationAddress.trim(),
      kmGoing: data.kmGoing,
      kmReturn: data.kmReturn,
      notes: data.notes?.trim() ?? null,
    },
  });
  revalidatePath("/km-reimbursement/places");
  revalidatePath("/km-reimbursement/settings");
  revalidatePath("/km-reimbursement");
}

export async function deleteKmPlace(id: string): Promise<void> {
  const userId = await requireAuth();
  await db.kmPlace.deleteMany({ where: { id, userId } });
  revalidatePath("/km-reimbursement/places");
  revalidatePath("/km-reimbursement/settings");
}

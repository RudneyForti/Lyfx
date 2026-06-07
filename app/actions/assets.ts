"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";

// [FIX M-1] Parse Brazilian decimal format: "1.234,56" → 1234.56
function parseBR(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return v;
  const normalized = String(v).replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return isNaN(n) ? null : n;
}

const INCLUDE_EXPENSES = { expenses: { orderBy: { dueDate: "asc" as const } } };

export async function getAssets() {
  const userId = await requireAuth();
  return db.asset.findMany({
    where: { userId },
    include: INCLUDE_EXPENSES,
    orderBy: { createdAt: "asc" },
  });
}

export async function getAssetsSummary() {
  const userId = await requireAuth();
  const assets = await db.asset.findMany({
    where: { userId },
    include: { expenses: true },
  });
  const totalAssets = assets.length;
  const totalCurrentValue = assets.reduce((s, a) => s + (a.currentValue ?? 0), 0);
  const allExpenses = assets.flatMap((a) => a.expenses);
  const totalAnnualCost = allExpenses.reduce((s, e) => s + e.amount, 0);
  const pendingExpenses = allExpenses.filter((e) => !e.paid).length;
  return { totalAssets, totalCurrentValue, totalAnnualCost, pendingExpenses };
}

export async function createAsset(data: {
  name: string;
  type: string;
  propertyAddress?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  plate?: string | null;
  purchaseValue?: number | string | null;
  currentValue?: number | string | null;
  purchaseDate?: string | null;
  notes?: string | null;
}) {
  const userId = await requireAuth();
  const asset = await db.asset.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      propertyAddress: data.propertyAddress ?? null,
      make: data.make ?? null,
      model: data.model ?? null,
      year: data.year ?? null,
      plate: data.plate ?? null,
      purchaseValue: parseBR(data.purchaseValue),
      currentValue: parseBR(data.currentValue),
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      notes: data.notes ?? null,
    },
  });
  revalidatePath("/assets");
  revalidatePath("/dashboard");
  return asset;
}

export async function updateAsset(id: string, data: {
  name?: string;
  type?: string;
  propertyAddress?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  plate?: string | null;
  purchaseValue?: number | string | null;
  currentValue?: number | string | null;
  purchaseDate?: string | null;
  notes?: string | null;
}) {
  const userId = await requireAuth();
  await db.asset.updateMany({
    where: { id, userId },
    data: {
      ...data,
      purchaseValue: data.purchaseValue !== undefined ? parseBR(data.purchaseValue) : undefined,
      currentValue: data.currentValue !== undefined ? parseBR(data.currentValue) : undefined,
      purchaseDate: data.purchaseDate !== undefined
        ? (data.purchaseDate ? new Date(data.purchaseDate) : null)
        : undefined,
    },
  });
  revalidatePath("/assets");
  revalidatePath("/dashboard");
}

export async function deleteAsset(id: string) {
  const userId = await requireAuth();
  await db.asset.deleteMany({ where: { id, userId } });
  revalidatePath("/assets");
  revalidatePath("/dashboard");
}

// ── Expenses ──

export async function createAssetExpense(data: {
  assetId: string;
  name: string;
  type: string;
  amount: number;
  dueDate?: string | null;
  notes?: string | null;
}) {
  const userId = await requireAuth();
  // [FIX B-5] Verify the asset belongs to this user before adding expense
  const asset = await db.asset.findFirst({ where: { id: data.assetId, userId } });
  if (!asset) throw new Error("Bem não encontrado.");
  await db.assetExpense.create({
    data: {
      userId,
      assetId: data.assetId,
      name: data.name,
      type: data.type,
      amount: data.amount,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes ?? null,
    },
  });
  revalidatePath("/assets");
  revalidatePath("/dashboard");
}

export async function updateAssetExpense(id: string, data: {
  name?: string;
  type?: string;
  amount?: number;
  dueDate?: string | null;
  notes?: string | null;
}) {
  const userId = await requireAuth();
  await db.assetExpense.updateMany({
    where: { id, userId },
    data: {
      ...data,
      dueDate: data.dueDate !== undefined
        ? (data.dueDate ? new Date(data.dueDate) : null)
        : undefined,
    },
  });
  revalidatePath("/assets");
}

export async function toggleExpensePaid(id: string, paid: boolean) {
  const userId = await requireAuth();
  await db.assetExpense.updateMany({
    where: { id, userId },
    data: { paid, paidAt: paid ? new Date() : null },
  });
  revalidatePath("/assets");
}

export async function deleteAssetExpense(id: string) {
  const userId = await requireAuth();
  await db.assetExpense.deleteMany({ where: { id, userId } });
  revalidatePath("/assets");
}

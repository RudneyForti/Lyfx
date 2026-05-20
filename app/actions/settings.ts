"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";

async function getOrCreate(userId: string) {
  const existing = await db.settings.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.settings.create({ data: { userId } });
}

export async function getSettings() {
  const userId = await requireAuth();
  return getOrCreate(userId);
}

export async function updateExpectedIncome(amount: number) {
  const userId = await requireAuth();
  const settings = await getOrCreate(userId);
  const updated = await db.settings.update({
    where: { id: settings.id },
    data: { expectedMonthlyIncome: amount },
  });
  revalidatePath("/budget");
  return updated;
}

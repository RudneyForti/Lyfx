"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

async function getOrCreate() {
  const existing = await db.settings.findFirst();
  if (existing) return existing;
  return db.settings.create({ data: {} });
}

export async function getSettings() {
  return getOrCreate();
}

export async function updateExpectedIncome(amount: number) {
  const settings = await getOrCreate();
  const updated = await db.settings.update({
    where: { id: settings.id },
    data: { expectedMonthlyIncome: amount },
  });
  revalidatePath("/budget");
  return updated;
}

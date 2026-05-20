"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { TransactionCategory } from "@/lib/types";

export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getBudgets(): Promise<Budget[]> {
  const userId = await requireAuth();
  return db.budget.findMany({ where: { userId }, orderBy: { category: "asc" } });
}

export async function setBudget(category: TransactionCategory, amount: number): Promise<Budget> {
  const userId = await requireAuth();
  const budget = await db.budget.upsert({
    where: { userId_category: { userId, category } },
    update: { amount },
    create: { userId, category, amount },
  });
  revalidatePath("/budget");
  return budget;
}

export async function deleteBudget(category: TransactionCategory) {
  const userId = await requireAuth();
  await db.budget.delete({ where: { userId_category: { userId, category } } });
  revalidatePath("/budget");
}

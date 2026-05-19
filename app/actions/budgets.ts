"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { TransactionCategory } from "@/lib/types";

export interface Budget {
  id: string;
  category: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getBudgets(): Promise<Budget[]> {
  return db.budget.findMany({ orderBy: { category: "asc" } });
}

export async function setBudget(category: TransactionCategory, amount: number): Promise<Budget> {
  const budget = await db.budget.upsert({
    where: { category },
    update: { amount },
    create: { category, amount },
  });
  revalidatePath("/budget");
  return budget;
}

export async function deleteBudget(category: TransactionCategory) {
  await db.budget.delete({ where: { category } });
  revalidatePath("/budget");
}

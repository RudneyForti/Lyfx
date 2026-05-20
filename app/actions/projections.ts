"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export interface MonthProjection {
  year: number;
  month: number;
  label: string;
  incomeCommitted: number;
  expenseCommitted: number;
  free: number;
  items: { description: string; amount: number; type: "income" | "expense"; isAnnual: boolean }[];
}

const PT_MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export async function getProjections(): Promise<MonthProjection[]> {
  const userId = await requireAuth();
  const now = new Date();
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 12, 0);

  // Fetch recurring transactions + future installments in parallel
  const [recurring, installments] = await Promise.all([
    db.transaction.findMany({
      where: { userId, recurrence: { in: ["monthly", "yearly"] } },
      select: { description: true, amount: true, type: true, recurrence: true, date: true, recurrenceEndsAt: true },
    }),
    db.transaction.findMany({
      where: {
        userId,
        installmentGroupId: { not: null },
        date: { gte: new Date(now.getFullYear(), now.getMonth(), 1), lte: rangeEnd },
      },
      select: { description: true, amount: true, type: true, date: true, installmentNumber: true, installmentTotal: true },
    }),
  ]);

  const projections: MonthProjection[] = [];

  for (let i = 0; i < 12; i++) {
    const projYear  = now.getMonth() + i >= 12
      ? now.getFullYear() + Math.floor((now.getMonth() + i) / 12)
      : now.getFullYear();
    const projMonth = (now.getMonth() + i) % 12; // 0-indexed

    const items: MonthProjection["items"] = [];

    for (const tx of installments) {
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() === projYear && txDate.getMonth() === projMonth) {
        items.push({
          description: tx.description,
          amount: tx.amount,
          type: tx.type === "credit" ? "income" : "expense",
          isAnnual: false,
        });
      }
    }

    for (const tx of recurring) {
      const txDate = new Date(tx.date);

      // Check if still active (respects recurrenceEndsAt)
      if (tx.recurrenceEndsAt) {
        const ends = new Date(tx.recurrenceEndsAt);
        if (ends < new Date(projYear, projMonth, 1)) continue;
      }

      if (tx.recurrence === "monthly") {
        // Must have started already
        if (txDate <= new Date(projYear, projMonth + 1, 0)) {
          items.push({
            description: tx.description,
            amount: tx.amount,
            type: tx.type === "credit" ? "income" : "expense",
            isAnnual: false,
          });
        }
      } else if (tx.recurrence === "yearly") {
        // Only appears in the month it's due
        if (txDate.getMonth() === projMonth) {
          items.push({
            description: tx.description,
            amount: tx.amount,
            type: tx.type === "credit" ? "income" : "expense",
            isAnnual: true,
          });
        }
      }
    }

    const incomeCommitted = items
      .filter(it => it.type === "income")
      .reduce((s, it) => s + it.amount, 0);

    const expenseCommitted = items
      .filter(it => it.type === "expense")
      .reduce((s, it) => s + it.amount, 0);

    projections.push({
      year: projYear,
      month: projMonth,
      label: `${PT_MONTHS[projMonth]}/${String(projYear).slice(2)}`,
      incomeCommitted,
      expenseCommitted,
      free: incomeCommitted - expenseCommitted,
      items,
    });
  }

  return projections;
}

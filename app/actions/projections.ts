"use server";

import { db } from "@/lib/db";

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
  const now = new Date();

  // Fetch all recurring transactions
  const recurring = await db.transaction.findMany({
    where: { recurrence: { in: ["monthly", "annual"] } },
    select: {
      description: true,
      amount: true,
      type: true,
      recurrence: true,
      date: true,
      recurrenceEndsAt: true,
    },
  });

  const projections: MonthProjection[] = [];

  for (let i = 0; i < 12; i++) {
    const projYear  = now.getMonth() + i >= 12
      ? now.getFullYear() + Math.floor((now.getMonth() + i) / 12)
      : now.getFullYear();
    const projMonth = (now.getMonth() + i) % 12; // 0-indexed

    const items: MonthProjection["items"] = [];

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
            type: tx.type as "income" | "expense",
            isAnnual: false,
          });
        }
      } else if (tx.recurrence === "annual") {
        // Only appears in the month it's due
        if (txDate.getMonth() === projMonth) {
          items.push({
            description: tx.description,
            amount: tx.amount,
            type: tx.type as "income" | "expense",
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

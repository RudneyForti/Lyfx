"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { getDRESummary } from "./transactions";
import { getHealthData } from "./health";
import { PT_MONTHS } from "@/lib/i18n";

export async function getDashboardData(month: number, year: number) {
  const userId = await requireAuth();

  const [summary, transactions, goals, trend, allTags, healthData] = await Promise.all([
    getDRESummary(month, year),
    db.transaction.findMany({
      where: {
        userId,
        date: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0, 23, 59, 59),
        },
      },
      orderBy: { date: "desc" },
      take: 8,
      include: { tags: { include: { tag: true } } },
    }),
    db.goal.findMany({
      where: { userId, status: "active" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, targetAmount: true, currentAmount: true, color: true, status: true },
    }),
    getMonthlyTrend(userId, month, year),
    db.tag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    getHealthData(month, year),
  ]);

  return { summary, transactions, goals, trend, allTags, healthScore: healthData.healthScore };
}

async function getMonthlyTrend(userId: string, currentMonth: number, currentYear: number) {
  // [CS-28] Paralelizado com Promise.all — era sequencial (6 awaits em loop)
  const slots = Array.from({ length: 6 }, (_, idx) => {
    const i = 5 - idx; // i de 5 até 0
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const start = new Date(y, m, 1);
    const end   = new Date(y, m + 1, 0, 23, 59, 59);
    return { i, m, query: db.transaction.findMany({
      where: { userId, date: { gte: start, lte: end } },
      select: { amount: true, type: true },
    }) };
  });

  const results = await Promise.all(slots.map((s) => s.query));

  return slots.map(({ i, m }, idx) => {
    const txs = results[idx];
    // fix: DB stores "credit"/"debit", not "income"/"expense"
    const income  = txs.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    return {
      label: PT_MONTHS[m],
      income,
      expense,
      isCurrent: i === 0,
    };
  });
}

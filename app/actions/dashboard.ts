"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { getDRESummary } from "./transactions";
import { getHealthData } from "./health";

const PT_MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

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
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const start = new Date(y, m, 1);
    const end   = new Date(y, m + 1, 0, 23, 59, 59);

    const txs = await db.transaction.findMany({
      where: { userId, date: { gte: start, lte: end } },
      select: { amount: true, type: true },
    });

    // fix: DB stores "credit"/"debit", not "income"/"expense"
    const income  = txs.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);

    months.push({
      label: PT_MONTHS[m],
      income,
      expense,
      isCurrent: i === 0,
    });
  }

  return months;
}

"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { getDRESummary } from "./transactions";
import { getSettings } from "./settings";
import { computeHealthScore } from "@/lib/health";

export async function getHealthData(month: number, year: number) {
  const userId = await requireAuth();

  // Current month DRE
  const summary = await getDRESummary(month, year);

  // User settings (includes declared reserveBalance)
  const settings = await getSettings();

  // Average expenses of the last 3 complete months (basis for reserve months)
  // [CS-28] Parallelized with Promise.all — used to be sequential (3 awaits in a loop)
  const pastMonths = [1, 2, 3].map((i) => {
    const d = new Date(year, month - 1 - i, 1);
    return getDRESummary(d.getMonth() + 1, d.getFullYear());
  });
  const pastDREs = await Promise.all(pastMonths);

  let totalExpenses = 0;
  let monthsWithData = 0;
  for (const dre of pastDREs) {
    if (dre.debits.total > 0) {
      totalExpenses += dre.debits.total;
      monthsWithData++;
    }
  }
  const avgMonthlyExpenses = monthsWithData > 0 ? totalExpenses / monthsWithData : 0;

  // Saldo de reserva: usa o valor declarado nas Settings.
  // Fallback to a proxy (sum of debit_longterm) if the user has not declared it yet.
  let reserveAmount = settings.reserveBalance;
  if (reserveAmount === 0) {
    const agg = await db.transaction.aggregate({
      where: { userId, category: "debit_longterm" },
      _sum: { amount: true },
    });
    reserveAmount = agg._sum.amount ?? 0;
  }

  // Reserve months = reserve balance / average monthly expense
  const reserveMonths =
    avgMonthlyExpenses > 0 ? reserveAmount / avgMonthlyExpenses : 0;

  const healthScore = computeHealthScore(summary, reserveMonths);

  return {
    summary,
    healthScore,
    reserveMonths,
    reserveBalance: settings.reserveBalance,
    avgMonthlyExpenses,
  };
}

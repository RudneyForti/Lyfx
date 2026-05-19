"use server";

import { db } from "@/lib/db";
import { getDRESummary } from "./transactions";
import { computeHealthScore, type HealthScore } from "@/lib/health";

export type { HealthScore };

export async function getHealthData(month: number, year: number) {
  // DRE do mês atual
  const summary = await getDRESummary(month, year);

  // Total acumulado em longo prazo (all-time proxy de reserva)
  const agg = await db.transaction.aggregate({
    where: { category: "debit_longterm" },
    _sum: { amount: true },
  });
  const totalLongterm = agg._sum.amount ?? 0;

  // Média de despesas dos últimos 3 meses completos (base para calcular meses de reserva)
  let totalExpenses = 0;
  let monthsWithData = 0;
  for (let i = 1; i <= 3; i++) {
    const d     = new Date(year, month - 1 - i, 1);
    const dre   = await getDRESummary(d.getMonth() + 1, d.getFullYear());
    if (dre.debits.total > 0) {
      totalExpenses += dre.debits.total;
      monthsWithData++;
    }
  }
  const avgMonthlyExpenses = monthsWithData > 0 ? totalExpenses / monthsWithData : 0;

  // Meses de reserva = acumulado / despesa média mensal
  const reserveMonths =
    avgMonthlyExpenses > 0 ? totalLongterm / avgMonthlyExpenses : 0;

  const healthScore = computeHealthScore(summary, reserveMonths);

  return { summary, healthScore, reserveMonths, totalLongterm, avgMonthlyExpenses };
}

"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { getDRESummary } from "./transactions";
import { getSettings } from "./settings";
import { computeHealthScore } from "@/lib/health";

export async function getHealthData(month: number, year: number) {
  const userId = await requireAuth();

  // DRE do mês atual
  const summary = await getDRESummary(month, year);

  // Configurações do usuário (inclui reserveBalance declarado)
  const settings = await getSettings();

  // Média de despesas dos últimos 3 meses completos (base para calcular meses de reserva)
  // [CS-28] Paralelizado com Promise.all — era sequencial (3 awaits em loop)
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
  // Fallback para proxy (soma de debit_longterm) se o usuário ainda não declarou.
  let reserveAmount = settings.reserveBalance;
  if (reserveAmount === 0) {
    const agg = await db.transaction.aggregate({
      where: { userId, category: "debit_longterm" },
      _sum: { amount: true },
    });
    reserveAmount = agg._sum.amount ?? 0;
  }

  // Meses de reserva = saldo de reserva / despesa média mensal
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

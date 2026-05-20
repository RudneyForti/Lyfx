"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { TransactionType, TransactionCategory } from "@/lib/types";

export interface MonthReport {
  year: number;
  month: number; // 1-indexed
  label: string;
  income: number;
  expense: number;
  result: number;
  categories: Record<TransactionCategory, number>;
}

export interface CategoryTotal {
  category: TransactionCategory;
  label: string;
  type: "credit" | "debit";
  total: number;
  avg: number;
  months: number;
}

const PT_MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  credit_fixed:       "Receita fixa",
  credit_variable:    "Receita variável",
  debit_fixed:        "Despesa fixa",
  debit_variable:     "Despesa variável",
  debit_committed:    "Comprometido",
  debit_longterm:     "Longo prazo",
  debit_seasonal:     "Sazonal",
  debit_unexpected:   "Imprevisível",
  debit_intentional:  "Alocação intencional",
};

export async function getReports(monthsBack: number = 6): Promise<{
  months: MonthReport[];
  categoryTotals: CategoryTotal[];
  totalIncome: number;
  totalExpense: number;
  avgMonthlyResult: number;
  contextBreakdown: {
    personal:     { income: number; expense: number };
    professional: { income: number; expense: number };
    none:         { income: number; expense: number };
  };
}> {
  const userId = await requireAuth();
  const now = new Date();

  // Build date range: from start of (now - monthsBack + 1) months ago to end of current month
  const startMonth = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);
  const endMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: { gte: startMonth, lte: endMonth },
    },
    select: { date: true, amount: true, type: true, category: true, context: true },
  });

  const reports: MonthReport[] = [];
  const allCategories = Object.keys(CATEGORY_LABELS) as TransactionCategory[];

  for (let i = 0; i < monthsBack; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1 + i, 1);
    const y    = monthDate.getFullYear();
    const rawM = monthDate.getMonth(); // 0-indexed
    const m    = rawM + 1;             // 1-indexed

    const monthStart = new Date(y, rawM, 1);
    const monthEnd   = new Date(y, rawM + 1, 0, 23, 59, 59);

    const monthTx = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d >= monthStart && d <= monthEnd;
    });

    const categories = {} as Record<TransactionCategory, number>;
    for (const cat of allCategories) categories[cat] = 0;

    let income = 0, expense = 0;
    for (const tx of monthTx) {
      categories[tx.category as TransactionCategory] = (categories[tx.category as TransactionCategory] || 0) + tx.amount;
      if (tx.type === "credit") income += tx.amount;
      else expense += tx.amount;
    }

    reports.push({
      year: y,
      month: m,
      label: `${PT_MONTHS[rawM]}/${String(y).slice(2)}`,
      income,
      expense,
      result: income - expense,
      categories,
    });
  }

  // Category totals (only categories with at least some data)
  const categoryTotals: CategoryTotal[] = allCategories
    .map(cat => {
      const total = reports.reduce((s, r) => s + r.categories[cat], 0);
      const activeMonths = reports.filter(r => r.categories[cat] > 0).length;
      return {
        category: cat,
        label: CATEGORY_LABELS[cat],
        type: cat.startsWith("credit") ? "credit" as const : "debit" as const,
        total,
        avg: activeMonths > 0 ? total / activeMonths : 0,
        months: activeMonths,
      };
    })
    .filter(ct => ct.total > 0);

  const totalIncome  = reports.reduce((s, r) => s + r.income, 0);
  const totalExpense = reports.reduce((s, r) => s + r.expense, 0);
  const avgMonthlyResult = reports.length > 0
    ? reports.reduce((s, r) => s + r.result, 0) / reports.length
    : 0;

  // Context breakdown
  const contextBreakdown = {
    personal:     { income: 0, expense: 0 },
    professional: { income: 0, expense: 0 },
    none:         { income: 0, expense: 0 },
  };
  for (const tx of transactions) {
    const key = tx.context === "personal" ? "personal"
              : tx.context === "professional" ? "professional"
              : "none";
    if (tx.type === "credit") contextBreakdown[key].income += tx.amount;
    else                      contextBreakdown[key].expense += tx.amount;
  }

  return { months: reports, categoryTotals, totalIncome, totalExpense, avgMonthlyResult, contextBreakdown };
}

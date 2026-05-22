"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { CATEGORIES } from "@/lib/categories";

export interface Alert {
  id: string;
  type: "budget" | "goal" | "projection" | "seasonal" | "liability";
  severity: "danger" | "warning" | "info";
  title: string;
  description: string;
  link: string;
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export async function getAlerts(): Promise<Alert[]> {
  const userId = await requireAuth();
  const alerts: Alert[] = [];

  const now = new Date();
  const yr = now.getFullYear();
  const mo = now.getMonth() + 1;
  const startOfMonth = new Date(yr, mo - 1, 1);
  const endOfMonth = new Date(yr, mo, 0, 23, 59, 59);

  // ── 1. Budget alerts ─────────────────────────────────────────────
  const [budgets, monthTx] = await Promise.all([
    db.budget.findMany({ where: { userId } }),
    db.transaction.findMany({
      where: { userId, type: "debit", date: { gte: startOfMonth, lte: endOfMonth } },
      select: { category: true, amount: true },
    }),
  ]);

  const spentByCategory: Record<string, number> = {};
  for (const tx of monthTx) {
    spentByCategory[tx.category] = (spentByCategory[tx.category] ?? 0) + tx.amount;
  }

  for (const budget of budgets) {
    const spent = spentByCategory[budget.category] ?? 0;
    const pct = budget.amount > 0 ? spent / budget.amount : 0;
    const catLabel = CATEGORIES.find((c) => c.value === budget.category)?.label ?? budget.category;
    if (pct >= 1) {
      alerts.push({
        id: `budget-${budget.id}`,
        type: "budget",
        severity: "danger",
        title: `Limite ultrapassado — ${catLabel}`,
        description: `Gasto de ${fmt(spent)} sobre limite de ${fmt(budget.amount)} (${Math.round(pct * 100)}%).`,
        link: "/budget",
      });
    } else if (pct >= 0.8) {
      alerts.push({
        id: `budget-${budget.id}`,
        type: "budget",
        severity: "warning",
        title: `Orçamento próximo do limite — ${catLabel}`,
        description: `${Math.round(pct * 100)}% usado. Restam ${fmt(budget.amount - spent)}.`,
        link: "/budget",
      });
    }
  }

  // ── 2. Goal payment alerts ───────────────────────────────────────
  const goalPayments = await db.goalPayment.findMany({
    where: {
      paid: false,
      dueDate: { lte: endOfMonth },
      goal: { userId },
    },
    include: { goal: { select: { name: true } } },
    orderBy: { dueDate: "asc" },
  });

  for (const payment of goalPayments) {
    const overdue = payment.dueDate < startOfMonth;
    alerts.push({
      id: `goal-${payment.id}`,
      type: "goal",
      severity: overdue ? "danger" : "warning",
      title: overdue
        ? `Meta em atraso — ${payment.goal.name}`
        : `Cobrança pendente — ${payment.goal.name}`,
      description: overdue
        ? `${fmt(payment.amount)} em atraso desde ${monthLabel(payment.dueDate)}.`
        : `${fmt(payment.amount)} vence este mês e ainda não foi marcado como pago.`,
      link: "/goals",
    });
  }

  // ── 3. Negative projection alerts ───────────────────────────────
  const [recurring, installments] = await Promise.all([
    db.transaction.findMany({
      where: { userId, recurrence: { in: ["monthly", "yearly"] } },
      select: { id: true, amount: true, type: true, recurrence: true, recurrenceEndsAt: true, date: true },
    }),
    db.transaction.findMany({
      where: { userId, installmentGroupId: { not: null } },
      select: { id: true, amount: true, type: true, date: true },
    }),
  ]);

  for (let i = 1; i <= 12; i++) {
    const projDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const pYr = projDate.getFullYear();
    const pMo = projDate.getMonth() + 1;
    const mStart = new Date(pYr, pMo - 1, 1);
    const mEnd = new Date(pYr, pMo, 0, 23, 59, 59);

    let income = 0;
    let expense = 0;

    for (const tx of recurring) {
      if (tx.recurrenceEndsAt && tx.recurrenceEndsAt < mStart) continue;
      if (tx.recurrence === "monthly") {
        tx.type === "credit" ? (income += tx.amount) : (expense += tx.amount);
      } else if (tx.recurrence === "yearly") {
        if (tx.date.getMonth() + 1 === pMo) {
          tx.type === "credit" ? (income += tx.amount) : (expense += tx.amount);
        }
      }
    }

    for (const tx of installments) {
      if (tx.date >= mStart && tx.date <= mEnd) {
        tx.type === "credit" ? (income += tx.amount) : (expense += tx.amount);
      }
    }

    const free = income - expense;
    if (free < 0) {
      alerts.push({
        id: `projection-${pYr}-${pMo}`,
        type: "projection",
        severity: "warning",
        title: `Projeção negativa — ${monthLabel(projDate)}`,
        description: `Saldo livre projetado: ${fmt(free)}. Revise seus compromissos recorrentes.`,
        link: "/projections",
      });
    }
  }

  // ── 4. Seasonal expense alerts ───────────────────────────────────
  const yearlyTx = await db.transaction.findMany({
    where: { userId, recurrence: "yearly", type: "debit" },
    select: { id: true, description: true, amount: true, date: true },
  });

  for (const tx of yearlyTx) {
    let next = new Date(now.getFullYear(), tx.date.getMonth(), tx.date.getDate());
    if (next <= now) next = new Date(now.getFullYear() + 1, tx.date.getMonth(), tx.date.getDate());

    const diffDays = (next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    const diffMonths = diffDays / 30;

    if (diffMonths <= 2) {
      const monthsLeft = Math.max(1, Math.ceil(diffMonths));
      const monthly = tx.amount / monthsLeft;
      alerts.push({
        id: `seasonal-${tx.id}`,
        type: "seasonal",
        severity: diffMonths <= 1 ? "danger" : "warning",
        title: `Despesa sazonal próxima — ${tx.description}`,
        description: `${fmt(tx.amount)} previsto para ${monthLabel(next)}. Provisione ${fmt(monthly)}/mês.`,
        link: "/fixed-expenses",
      });
    }
  }

  // ── 5. Passivos críticos (cheque especial / rotativo) ────────────────
  const criticalLiabilities = await db.liability.findMany({
    where: {
      userId,
      status: "active",
      type: { in: ["cheque_especial", "rotativo"] },
    },
    orderBy: { interestRate: "desc" },
  });

  const liabilityTypeLabel: Record<string, string> = {
    cheque_especial: "Cheque Especial",
    rotativo: "Rotativo do Cartão",
  };

  for (const liability of criticalLiabilities) {
    const typeLabel = liabilityTypeLabel[liability.type] ?? liability.type;
    const rate = liability.interestRate;
    const balance = liability.currentBalance;
    alerts.push({
      id: `liability-${liability.id}`,
      type: "liability",
      severity: "danger",
      title: `Passivo crítico — ${liability.name}`,
      description: `${typeLabel} com saldo de ${fmt(balance)} a ${rate.toFixed(1)}% a.m. (~${(Math.pow(1 + rate / 100, 12) - 1).toFixed(0)}% a.a.). Quitar essa dívida é a maior rentabilidade possível.`,
      link: "/liabilities",
    });
  }

  // Sort: danger → warning → info
  const order = { danger: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}

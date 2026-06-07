/**
 * alert-engine.ts — Motor de detecção de condições de alerta danger.
 * Lib pura (sem "use server") — pode ser importada por Server Actions.
 *
 * Centraliza a lógica compartilhada entre getAlerts() (alerts.ts) e
 * syncDangerAlerts() (notifications.ts) para eliminar duplicação. [CS-27]
 */

import { db } from "@/lib/db";

export interface AlertCondition {
  /** ID único da condição — usado como fingerprint em notificações */
  fingerprint: string;
  type: "budget" | "goal" | "seasonal" | "liability";
  severity: "warning" | "danger";
  title: string;
  message: string;
  link: string;
}

function fmt(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Detecta todas as condições de alerta danger para um usuário.
 * Retorna array vazio se nenhuma condição for encontrada.
 *
 * Cobre:
 *  1. Orçamentos ≥ 100% do limite (danger) — partilhado com syncDangerAlerts
 *  2. Metas com cobranças em atraso (danger) — partilhado com syncDangerAlerts
 *  3. Despesas sazonais a ≤ 1 mês (danger) — partilhado com syncDangerAlerts
 *  4. Passivos críticos com saldo > 0 (danger) — partilhado com syncDangerAlerts
 */
export async function computeDangerConditions(userId: string): Promise<AlertCondition[]> {
  const now = new Date();
  const yr = now.getFullYear();
  const mo = now.getMonth() + 1;
  const startOfMonth = new Date(yr, mo - 1, 1);
  const endOfMonth = new Date(yr, mo, 0, 23, 59, 59);

  const conditions: AlertCondition[] = [];

  // ── 1. Budget danger (gasto ≥ 100% do limite) ─────────────────────────────
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
    if (pct >= 1) {
      conditions.push({
        fingerprint: `budget-${budget.id}`,
        type: "budget",
        severity: "danger",
        title: "Limite ultrapassado",
        message: `Orçamento de ${budget.category} excedido: ${Math.round(pct * 100)}% usado.`,
        link: "/budget",
      });
    }
  }

  // ── 2. Goal overdue (cobrança em atraso) ──────────────────────────────────
  const overduePayments = await db.goalPayment.findMany({
    where: {
      paid: false,
      dueDate: { lt: startOfMonth },
      goal: { userId },
    },
    include: { goal: { select: { name: true } } },
  });

  for (const payment of overduePayments) {
    conditions.push({
      fingerprint: `goal-${payment.id}`,
      type: "goal",
      severity: "danger",
      title: `Meta em atraso — ${payment.goal.name}`,
      message: `Cobrança de ${fmt(payment.amount)} em atraso.`,
      link: "/goals",
    });
  }

  // ── 3. Despesas sazonais iminentes (≤ 1 mês) ──────────────────────────────
  const yearlyTx = await db.transaction.findMany({
    where: { userId, recurrence: "yearly", type: "debit" },
    select: { id: true, description: true, amount: true, date: true },
  });

  for (const tx of yearlyTx) {
    let next = new Date(now.getFullYear(), tx.date.getMonth(), tx.date.getDate());
    if (next <= now) next = new Date(now.getFullYear() + 1, tx.date.getMonth(), tx.date.getDate());
    const diffMonths = (next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (diffMonths <= 1) {
      conditions.push({
        fingerprint: `seasonal-${tx.id}`,
        type: "seasonal",
        severity: "danger",
        title: `Despesa sazonal iminente — ${tx.description}`,
        message: `${fmt(tx.amount)} vence em menos de 1 mês.`,
        link: "/fixed-expenses",
      });
    }
  }

  // ── 4. Passivos críticos (cheque especial / rotativo com saldo > 0) ───────
  const criticalLiabilities = await db.liability.findMany({
    where: {
      userId,
      status: "active",
      type: { in: ["cheque_especial", "rotativo"] },
      currentBalance: { gt: 0 },
    },
    select: { id: true, name: true, currentBalance: true, interestRate: true },
  });

  for (const liability of criticalLiabilities) {
    conditions.push({
      fingerprint: `liability-${liability.id}`,
      type: "liability",
      severity: "danger",
      title: `Passivo crítico — ${liability.name}`,
      message: `Saldo de ${fmt(liability.currentBalance)} a ${liability.interestRate.toFixed(1)}% a.m.`,
      link: "/liabilities",
    });
  }

  return conditions;
}

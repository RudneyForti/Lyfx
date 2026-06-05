"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "info" | "warning" | "danger" | "success";
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
}

/* ── Leitura ──────────────────────────────────────────────────────── */

/** Badge count — chamado pelo layout (userId já resolvido, sem requireAuth).
 *  Conta apenas notificações manuais/sistema (fingerprint=null).
 *  Alertas financeiros são computados em real-time por getAlerts() e não inflam o badge.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const now = new Date();
  return db.notification.count({
    where: {
      userId,
      fingerprint: null,   // ← apenas notificações (não alertas automáticos)
      readAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
}

/** Lista completa de notificações (manual + Studio).
 *  Exclui alertas automáticos (fingerprint != null) — esses são gerenciados por getAlerts().
 */
export async function getNotifications(): Promise<NotificationItem[]> {
  const userId = await requireAuth();
  const now = new Date();
  const rows = await db.notification.findMany({
    where: {
      userId,
      fingerprint: null,   // ← apenas notificações
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    type: n.type as NotificationItem["type"],
    link: n.link,
    readAt: n.readAt,
    createdAt: n.createdAt,
  }));
}

/* ── Escrita ──────────────────────────────────────────────────────── */

export async function markAsRead(id: string): Promise<void> {
  const userId = await requireAuth();
  await db.notification.updateMany({
    where: { id, userId },
    data: { readAt: new Date() },
  });
  revalidatePath("/", "layout");
}

export async function markAllAsRead(): Promise<void> {
  const userId = await requireAuth();
  await db.notification.updateMany({
    where: { userId, fingerprint: null, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/", "layout");
}

/** Remove uma notificação lida. Só remove se pertencer ao usuário autenticado. */
export async function deleteNotification(id: string): Promise<void> {
  const userId = await requireAuth();
  await db.notification.deleteMany({
    where: { id, userId, fingerprint: null }, // nunca apaga alertas automáticos
  });
  revalidatePath("/", "layout");
}

/** Remove todas as notificações do usuário (apenas manuais/sistema — fingerprint=null). */
export async function deleteAllNotifications(): Promise<void> {
  const userId = await requireAuth();
  await db.notification.deleteMany({
    where: { userId, fingerprint: null },
  });
  revalidatePath("/", "layout");
}

/* ── Criação interna ─────────────────────────────────────────────── */

interface CreateNotificationInput {
  userId: string;
  title: string;
  body: string;
  type?: "info" | "warning" | "danger" | "success";
  link?: string;
  fingerprint?: string;
  expiresAt?: Date;
}

export async function createNotification(data: CreateNotificationInput): Promise<void> {
  await db.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      body: data.body,
      type: data.type ?? "info",
      link: data.link ?? null,
      fingerprint: data.fingerprint ?? null,
      expiresAt: data.expiresAt ?? null,
    },
  });
}

/* ── Sync de alertas danger ──────────────────────────────────────── */

/**
 * Converte alertas críticos (danger) em notificações persistidas.
 * Usa fingerprint + TTL 7d para evitar duplicatas.
 * Chamado pelo layout a cada render — leveza garantida pelo dedup.
 */
export async function syncDangerAlerts(userId: string): Promise<void> {
  const now = new Date();
  const ttl = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Fingerprints já existentes e não expirados
  const existing = await db.notification.findMany({
    where: {
      userId,
      fingerprint: { not: null },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { fingerprint: true },
  });
  const seen = new Set(existing.map((n) => n.fingerprint!));

  const toCreate: CreateNotificationInput[] = [];

  // ── 1. Budget danger (gasto ≥ 100% do limite) ──────────────────────
  const yr = now.getFullYear();
  const mo = now.getMonth() + 1;
  const startOfMonth = new Date(yr, mo - 1, 1);
  const endOfMonth = new Date(yr, mo, 0, 23, 59, 59);

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
    const fp = `budget-${budget.id}`;
    if (seen.has(fp)) continue;
    const spent = spentByCategory[budget.category] ?? 0;
    const pct = budget.amount > 0 ? spent / budget.amount : 0;
    if (pct >= 1) {
      toCreate.push({
        userId,
        title: `Limite ultrapassado`,
        body: `Orçamento de ${budget.category} excedido: ${Math.round(pct * 100)}% usado.`,
        type: "danger",
        link: "/budget",
        fingerprint: fp,
        expiresAt: ttl,
      });
    }
  }

  // ── 2. Goal overdue (cobrança em atraso) ───────────────────────────
  const overduePayments = await db.goalPayment.findMany({
    where: {
      paid: false,
      dueDate: { lt: startOfMonth },
      goal: { userId },
    },
    include: { goal: { select: { name: true } } },
  });

  for (const payment of overduePayments) {
    const fp = `goal-${payment.id}`;
    if (seen.has(fp)) continue;
    toCreate.push({
      userId,
      title: `Meta em atraso — ${payment.goal.name}`,
      body: `Cobrança de ${payment.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} em atraso.`,
      type: "danger",
      link: "/goals",
      fingerprint: fp,
      expiresAt: ttl,
    });
  }

  // ── 3. Seasonal danger (despesa anual em ≤ 1 mês) ──────────────────
  const yearlyTx = await db.transaction.findMany({
    where: { userId, recurrence: "yearly", type: "debit" },
    select: { id: true, description: true, amount: true, date: true },
  });

  for (const tx of yearlyTx) {
    let next = new Date(now.getFullYear(), tx.date.getMonth(), tx.date.getDate());
    if (next <= now) next = new Date(now.getFullYear() + 1, tx.date.getMonth(), tx.date.getDate());
    const diffMonths = (next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (diffMonths <= 1) {
      const fp = `seasonal-${tx.id}`;
      if (seen.has(fp)) continue;
      toCreate.push({
        userId,
        title: `Despesa sazonal iminente — ${tx.description}`,
        body: `${tx.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} vence em menos de 1 mês.`,
        type: "danger",
        link: "/fixed-expenses",
        fingerprint: fp,
        expiresAt: ttl,
      });
    }
  }

  // ── 4. Passivos críticos (cheque especial / rotativo com saldo > 0) ─
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
    const fp = `liability-${liability.id}`;
    if (seen.has(fp)) continue;
    toCreate.push({
      userId,
      title: `Passivo crítico — ${liability.name}`,
      body: `Saldo de ${liability.currentBalance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} a ${liability.interestRate.toFixed(1)}% a.m.`,
      type: "danger",
      link: "/liabilities",
      fingerprint: fp,
      expiresAt: ttl,
    });
  }

  // Inserir em lote
  if (toCreate.length > 0) {
    await db.notification.createMany({
      data: toCreate.map((n) => ({
        userId: n.userId,
        title: n.title,
        body: n.body,
        type: n.type ?? "info",
        link: n.link ?? null,
        fingerprint: n.fingerprint ?? null,
        expiresAt: n.expiresAt ?? null,
      })),
    });
  }
}

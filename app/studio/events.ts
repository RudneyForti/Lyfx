"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "./auth";

// ── CS-18: Event log for the Studio Data tab ─────────────────────────────────

export interface AuditEvent {
  id: string;
  eventType: "transaction" | "education" | "goal" | "notification" | "system";
  title: string;
  detail: string;
  actorType: "user" | "system";
  userId: string | null;
  userName: string | null;
  userPlanId: string | null;
  timestamp: Date;
}

export async function adminGetEventLog(filters?: {
  eventType?: string;
  planId?: string;
  userId?: string;
  limit?: number;
}): Promise<AuditEvent[]> {
  await requireAdmin();

  const limit = filters?.limit ?? 100;
  const et = filters?.eventType;

  // Resolve target userIds from plan/user filters
  let targetUserIds: string[] | null = null; // null = all users
  if (filters?.userId) {
    targetUserIds = [filters.userId];
  } else if (filters?.planId) {
    const users = await db.user.findMany({
      where: { planId: filters.planId },
      select: { id: true },
    });
    targetUserIds = users.map((u) => u.id);
  }

  // Build user name/plan lookup map
  const allUsers = await db.user.findMany({
    select: { id: true, name: true, planId: true },
  });
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  const events: AuditEvent[] = [];

  function include(type: string) { return !et || et === type; }
  function userWhere() {
    return targetUserIds ? { userId: { in: targetUserIds } } : {};
  }

  // ── Transactions ──────────────────────────────────────────────────────────
  if (include("transaction")) {
    const txs = await db.transaction.findMany({
      where: { ...userWhere() },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true, description: true, amount: true, type: true,
        category: true, userId: true, createdAt: true,
      },
    });
    for (const tx of txs) {
      const u = userMap.get(tx.userId);
      events.push({
        id: `tx-${tx.id}`,
        eventType: "transaction",
        title: tx.description,
        detail: `${tx.type === "credit" ? "+" : "-"}R$ ${tx.amount.toFixed(2)} · ${tx.category}`,
        actorType: "user",
        userId: tx.userId,
        userName: u?.name ?? null,
        userPlanId: u?.planId ?? null,
        timestamp: tx.createdAt,
      });
    }
  }

  // ── Education (PillProgress) ──────────────────────────────────────────────
  if (include("education")) {
    const pills = await db.pillProgress.findMany({
      where: { ...userWhere() },
      orderBy: { completedAt: "desc" },
      take: limit,
      select: {
        id: true, pillId: true, userId: true,
        completedAt: true, timeSpentSeconds: true, quizCorrect: true,
      },
    });
    for (const p of pills) {
      const u = userMap.get(p.userId);
      const dur = p.timeSpentSeconds < 60
        ? `${p.timeSpentSeconds}s`
        : `${Math.floor(p.timeSpentSeconds / 60)}min`;
      events.push({
        id: `edu-${p.id}`,
        eventType: "education",
        title: `Módulo educacional concluído`,
        detail: `${p.pillId} · ${dur}${p.quizCorrect ? " · quiz ✓" : ""}`,
        actorType: "user",
        userId: p.userId,
        userName: u?.name ?? null,
        userPlanId: u?.planId ?? null,
        timestamp: p.completedAt,
      });
    }
  }

  // ── Goal payments ─────────────────────────────────────────────────────────
  if (include("goal")) {
    const goalWhere = targetUserIds ? { userId: { in: targetUserIds } } : {};
    const goals = await db.goal.findMany({
      where: goalWhere,
      select: { id: true, name: true, userId: true },
    });
    if (goals.length > 0) {
      const goalMap = new Map(goals.map((g) => [g.id, g]));
      const payments = await db.goalPayment.findMany({
        where: { paid: true, goalId: { in: goals.map((g) => g.id) } },
        orderBy: { paidAt: "desc" },
        take: limit,
        select: { id: true, goalId: true, amount: true, paidAt: true },
      });
      for (const p of payments) {
        const goal = goalMap.get(p.goalId);
        const u = goal ? userMap.get(goal.userId) : null;
        events.push({
          id: `goal-${p.id}`,
          eventType: "goal",
          title: `Pagamento de meta registrado`,
          detail: `${goal?.name ?? "—"} · R$ ${p.amount.toFixed(2)}`,
          actorType: "user",
          userId: goal?.userId ?? null,
          userName: u?.name ?? null,
          userPlanId: u?.planId ?? null,
          timestamp: p.paidAt ?? new Date(0),
        });
      }
    }
  }

  // ── Auto-generated alerts (fingerprint not null) ──────────────────────────
  if (include("notification")) {
    const notifs = await db.notification.findMany({
      where: { fingerprint: { not: null }, ...userWhere() },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, title: true, body: true, type: true, userId: true, createdAt: true },
    });
    for (const n of notifs) {
      const u = userMap.get(n.userId);
      events.push({
        id: `notif-${n.id}`,
        eventType: "notification",
        title: `Alerta automático: ${n.title}`,
        detail: n.body.length > 90 ? n.body.slice(0, 90) + "…" : n.body,
        actorType: "system",
        userId: n.userId,
        userName: u?.name ?? null,
        userPlanId: u?.planId ?? null,
        timestamp: n.createdAt,
      });
    }
  }

  // ── System events (Studio-level — only when no user/plan filter) ──────────
  if (include("system") && targetUserIds === null) {
    // User registrations
    const registrations = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, name: true, planId: true, createdAt: true },
    });
    for (const u of registrations) {
      events.push({
        id: `reg-${u.id}`,
        eventType: "system",
        title: `Novo usuário registrado`,
        detail: u.name,
        actorType: "system",
        userId: u.id,
        userName: u.name,
        userPlanId: u.planId ?? null,
        timestamp: u.createdAt,
      });
    }

    // Studio broadcasts (deduplicated by broadcastId)
    const broadcasts = await db.notification.findMany({
      where: { broadcastId: { not: null }, fingerprint: null },
      orderBy: { createdAt: "asc" }, // asc so first row = earliest (= creation time)
      take: 500,
      select: { broadcastId: true, title: true, body: true, createdAt: true },
    });
    const seenBroadcast = new Set<string>();
    for (const b of broadcasts) {
      if (!b.broadcastId || seenBroadcast.has(b.broadcastId)) continue;
      seenBroadcast.add(b.broadcastId);
      events.push({
        id: `broadcast-${b.broadcastId}`,
        eventType: "system",
        title: `Broadcast enviado: ${b.title}`,
        detail: b.body.length > 90 ? b.body.slice(0, 90) + "…" : b.body,
        actorType: "system",
        userId: null,
        userName: null,
        userPlanId: null,
        timestamp: b.createdAt,
      });
    }

    // AppConfig writes (excluding adminNotes — too noisy)
    const configs = await db.appConfig.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { key: true, value: true, updatedAt: true },
    });
    for (const c of configs) {
      if (c.key === "adminNotes") continue;
      events.push({
        id: `config-${c.key}`,
        eventType: "system",
        title: `Configuração alterada`,
        detail: `${c.key}: ${c.value.length > 60 ? c.value.slice(0, 60) + "…" : c.value}`,
        actorType: "system",
        userId: null,
        userName: null,
        userPlanId: null,
        timestamp: c.updatedAt,
      });
    }
  }

  // Sort by timestamp desc and enforce limit
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return events.slice(0, limit);
}

// ── CS-35: Security Audit Log (admin view) ────────────────────────────────────

export interface AdminSecurityEvent {
  id:          string;
  action:      string;
  label:       string;
  description: string;
  variant:     "success" | "danger" | "warning" | "info";
  userId:      string | null;
  userName:    string | null;
  userEmail:   string | null;
  ip:          string | null;
  createdAt:   Date;
}

export async function getAdminSecurityLog(filters?: {
  userId?:  string;
  action?:  string;
  limit?:   number;
}): Promise<AdminSecurityEvent[]> {
  await requireAdmin();

  const { AUDIT_META } = await import("@/lib/audit");
  type AuditAction = keyof typeof AUDIT_META;

  const limit = filters?.limit ?? 200;

  const logs = await db.auditLog.findMany({
    where: {
      ...(filters?.userId ? { userId: filters.userId } : {}),
      ...(filters?.action  ? { action: filters.action }  : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, action: true, userId: true, ip: true, metadata: true, createdAt: true },
  });

  // Build userId → user map for a single extra query
  const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean) as string[])];
  const users   = userIds.length
    ? await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
    : [];
  const userMap = new Map(users.map(u => [u.id, u]));

  return logs.map(log => {
    const action   = log.action as AuditAction;
    const meta     = AUDIT_META[action] ?? { label: action, description: () => action, variant: "info" as const };
    const metadata = (log.metadata ?? undefined) as Record<string, unknown> | undefined;
    const user     = log.userId ? userMap.get(log.userId) : null;
    return {
      id:          log.id,
      action:      log.action,
      label:       meta.label,
      description: meta.description(metadata),
      variant:     meta.variant,
      userId:      log.userId,
      userName:    user?.name    ?? null,
      userEmail:   user?.email   ?? null,
      ip:          log.ip,
      createdAt:   log.createdAt,
    };
  });
}

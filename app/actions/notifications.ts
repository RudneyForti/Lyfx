"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { computeDangerConditions } from "@/lib/alert-engine";

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

/** Badge count — chamado pelo layout.
 *  Usa requireAuth() internamente — ignora userId externo para garantir isolamento.
 *  Conta apenas notificações manuais/sistema (fingerprint=null).
 *  Alertas financeiros são computados em real-time por getAlerts() e não inflam o badge.
 */
export async function getUnreadCount(): Promise<number> {
  const userId = await requireAuth();
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
 * [CS-27] Lógica de detecção extraída para lib/alert-engine.ts.
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

  // Detectar condições via motor centralizado
  const conditions = await computeDangerConditions(userId);

  const toCreate: CreateNotificationInput[] = conditions
    .filter((c) => !seen.has(c.fingerprint))
    .map((c) => ({
      userId,
      title: c.title,
      body: c.message,
      type: "danger" as const,
      link: c.link,
      fingerprint: c.fingerprint,
      expiresAt: ttl,
    }));

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

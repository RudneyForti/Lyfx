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

/* ── Read ─────────────────────────────────────────────────────────── */

/** Badge count — called by the layout.
 *  Uses requireAuth() internally — ignores any external userId to guarantee isolation.
 *  Counts only manual/system notifications (fingerprint=null).
 *  Financial alerts are computed in real-time by getAlerts() and do not inflate the badge.
 */
export async function getUnreadCount(): Promise<number> {
  const userId = await requireAuth();
  const now = new Date();
  return db.notification.count({
    where: {
      userId,
      fingerprint: null,   // ← notifications only (not automatic alerts)
      readAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
}

/** Full list of notifications (manual + Studio).
 *  Excludes automatic alerts (fingerprint != null) — those are managed by getAlerts().
 */
export async function getNotifications(): Promise<NotificationItem[]> {
  const userId = await requireAuth();
  const now = new Date();
  const rows = await db.notification.findMany({
    where: {
      userId,
      fingerprint: null,   // ← notifications only
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

/* ── Write ────────────────────────────────────────────────────────── */

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

/** Removes a read notification. Only removes if it belongs to the authenticated user. */
export async function deleteNotification(id: string): Promise<void> {
  const userId = await requireAuth();
  await db.notification.deleteMany({
    where: { id, userId, fingerprint: null }, // never deletes automatic alerts
  });
  revalidatePath("/", "layout");
}

/** Removes all of the user's notifications (manual/system only — fingerprint=null). */
export async function deleteAllNotifications(): Promise<void> {
  const userId = await requireAuth();
  await db.notification.deleteMany({
    where: { userId, fingerprint: null },
  });
  revalidatePath("/", "layout");
}

/* ── Internal creation ──────────────────────────────────────────────── */

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

/* ── Danger alert sync ───────────────────────────────────────────── */

/**
 * Converts critical (danger) alerts into persisted notifications.
 * Uses fingerprint + 7-day TTL to avoid duplicates.
 * Called by the layout on every render — lightweight thanks to the dedup.
 * [CS-27] Detection logic extracted to lib/alert-engine.ts.
 */
export async function syncDangerAlerts(userId: string): Promise<void> {
  const now = new Date();
  const ttl = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Fingerprints that already exist and are not expired
  const existing = await db.notification.findMany({
    where: {
      userId,
      fingerprint: { not: null },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { fingerprint: true },
  });
  const seen = new Set(existing.map((n) => n.fingerprint!));

  // Detect conditions via the centralized engine
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

  // Batch insert
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

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "./auth";

// ── CS-18: Manual notifications via Studio ───────────────────────────────────

export interface AdminSendNotificationInput {
  recipientType: "all" | "plan" | "user";
  planId?: string;
  userId?: string;
  title: string;
  body: string;
  type: "info" | "warning" | "danger" | "success";
  link?: string;
}

export interface NotifBroadcast {
  broadcastId: string | null;
  sampleId: string;
  title: string;
  body: string;
  type: "info" | "warning" | "danger" | "success";
  link: string | null;
  createdAt: Date;
  totalCount: number;
  readCount: number;
}

export async function adminSendNotification(
  input: AdminSendNotificationInput
): Promise<{ ok: true; count: number } | { error: string }> {
  await requireAdmin();

  if (!input.title.trim()) return { error: "Título obrigatório." };
  if (!input.body.trim())  return { error: "Mensagem obrigatória." };

  let userIds: string[] = [];

  if (input.recipientType === "all") {
    const users = await db.user.findMany({ select: { id: true } });
    userIds = users.map((u) => u.id);
  } else if (input.recipientType === "plan") {
    if (!input.planId) return { error: "Plano não selecionado." };
    const users = await db.user.findMany({ where: { planId: input.planId }, select: { id: true } });
    userIds = users.map((u) => u.id);
  } else if (input.recipientType === "user") {
    if (!input.userId) return { error: "Usuário não selecionado." };
    userIds = [input.userId];
  }

  if (userIds.length === 0) return { error: "Nenhum destinatário encontrado." };

  const broadcastId = crypto.randomUUID();

  await db.notification.createMany({
    data: userIds.map((uid) => ({
      userId: uid,
      title: input.title.trim(),
      body: input.body.trim(),
      type: input.type,
      link: input.link?.trim() || null,
      broadcastId,
    })),
  });

  revalidatePath("/", "layout");
  return { ok: true, count: userIds.length };
}

/** Lists manual notifications grouped by broadcastId for the Studio panel. */
export async function adminGetManualNotifications(): Promise<NotifBroadcast[]> {
  await requireAdmin();

  // Fetch all notifications without a fingerprint (= manual)
  const rows = await db.notification.findMany({
    where: { fingerprint: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, broadcastId: true, title: true, body: true, type: true, link: true, createdAt: true, readAt: true },
  });

  // Group by broadcastId (null = legacy without broadcastId, each is its own group)
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.broadcastId ?? `__solo__${row.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  return Array.from(groups.entries()).map(([, items]) => {
    const first = items[0];
    return {
      broadcastId: first.broadcastId,
      sampleId: first.id,
      title: first.title,
      body: first.body,
      type: first.type as NotifBroadcast["type"],
      link: first.link,
      createdAt: first.createdAt,
      totalCount: items.length,
      readCount: items.filter((n) => n.readAt !== null).length,
    };
  });
}

export async function adminDeleteNotification(
  broadcastId: string | null,
  sampleId: string
): Promise<{ ok: true }> {
  await requireAdmin();

  if (broadcastId) {
    await db.notification.deleteMany({ where: { broadcastId } });
  } else {
    await db.notification.delete({ where: { id: sampleId } });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function adminUpdateNotification(
  broadcastId: string | null,
  sampleId: string,
  data: { title: string; body: string; type: string; link: string | null }
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();

  if (!data.title.trim()) return { error: "Título obrigatório." };
  if (!data.body.trim())  return { error: "Mensagem obrigatória." };

  const update = {
    title: data.title.trim(),
    body: data.body.trim(),
    type: data.type,
    link: data.link?.trim() || null,
  };

  if (broadcastId) {
    await db.notification.updateMany({ where: { broadcastId }, data: update });
  } else {
    await db.notification.update({ where: { id: sampleId }, data: update });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

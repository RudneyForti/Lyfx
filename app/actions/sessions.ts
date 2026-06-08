"use server";

/**
 * CS-34 — Gerenciamento de sessões ativas
 * Permite ao usuário ver e revogar suas sessões em outros dispositivos.
 */

import { db } from "@/lib/db";
import { requireSession, invalidateOtherSessions } from "@/lib/session";
import { logEventBg } from "@/lib/audit"; // CS-35

// ── UA parser mínimo ──────────────────────────────────────────────────────────
// Sem biblioteca externa — detecta os casos mais comuns por regex.

export interface SessionInfo {
  id:          string;
  ip:          string | null;
  device:      string;   // nome legível derivado do user-agent
  createdAt:   Date;
  lastSeenAt:  Date;
  isCurrent:   boolean;
}

function parseDevice(ua: string | null): string {
  if (!ua) return "Dispositivo desconhecido";
  const s = ua.toLowerCase();

  // Sistema operacional
  let os = "Desktop";
  if (s.includes("iphone"))        os = "iPhone";
  else if (s.includes("ipad"))     os = "iPad";
  else if (s.includes("android"))  os = "Android";
  else if (s.includes("windows"))  os = "Windows";
  else if (s.includes("mac os"))   os = "macOS";
  else if (s.includes("linux"))    os = "Linux";

  // Navegador
  let browser = "Navegador";
  if (s.includes("firefox"))                                    browser = "Firefox";
  else if (s.includes("edg/") || s.includes("edge"))           browser = "Edge";
  else if (s.includes("opr/") || s.includes("opera"))          browser = "Opera";
  else if (s.includes("chrome"))                                browser = "Chrome";
  else if (s.includes("safari") && !s.includes("chrome"))      browser = "Safari";

  return `${browser} · ${os}`;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** Retorna todas as sessões ativas do usuário, marcando a sessão atual. */
export async function getSessions(): Promise<SessionInfo[]> {
  const { userId, sessionId } = await requireSession();

  const sessions = await db.session.findMany({
    where:   { userId, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
    select:  { id: true, ip: true, userAgent: true, createdAt: true, lastSeenAt: true },
  });

  return sessions.map((s) => ({
    id:         s.id,
    ip:         s.ip,
    device:     parseDevice(s.userAgent),
    createdAt:  s.createdAt,
    lastSeenAt: s.lastSeenAt,
    isCurrent:  s.id === sessionId,
  }));
}

/** Revoga uma sessão específica (somente sessões do próprio usuário). */
export async function revokeSession(targetSessionId: string): Promise<void> {
  const { userId } = await requireSession();

  // deleteMany com userId garante que o usuário só pode revogar sessões próprias
  await db.session.deleteMany({
    where: { id: targetSessionId, userId },
  });

  // CS-35: log de revogação de sessão
  logEventBg({ action: "session.revoked", userId, sessionId: targetSessionId });
}

/** Revoga todas as sessões exceto a atual. */
export async function revokeAllOtherSessions(): Promise<{ count: number }> {
  const { userId, sessionId } = await requireSession();

  // Conta quantas sessões serão revogadas antes de deletar
  const toRevoke = await db.session.count({
    where: { userId, id: { not: sessionId } },
  });

  await invalidateOtherSessions(userId, sessionId);

  // CS-35: log com total de sessões revogadas
  logEventBg({ action: "session.revoked_all", userId, sessionId, metadata: { count: toRevoke } });

  // Retorna a sessão atual para confirmar que ainda está ativa
  const remaining = await db.session.count({ where: { userId } });
  return { count: remaining };
}

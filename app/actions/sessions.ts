"use server";

/**
 * CS-34 — Active session management
 * Lets the user view and revoke their sessions on other devices.
 */

import { db } from "@/lib/db";
import { requireSession, invalidateOtherSessions } from "@/lib/session";
import { logEventBg } from "@/lib/audit"; // CS-35

// ── Minimal UA parser ─────────────────────────────────────────────────────────
// Sem biblioteca externa — detecta os casos mais comuns por regex.

export interface SessionInfo {
  id:          string;
  ip:          string | null;
  device:      string;   // human-readable name derived from the user-agent
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

/** Returns all of the user's active sessions, flagging the current one. */
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

/** Revokes a specific session (only the user's own sessions). */
export async function revokeSession(targetSessionId: string): Promise<void> {
  const { userId } = await requireSession();

  // deleteMany with userId guarantees the user can only revoke their own sessions
  await db.session.deleteMany({
    where: { id: targetSessionId, userId },
  });

  // CS-35: log the session revocation
  logEventBg({ action: "session.revoked", userId, sessionId: targetSessionId });
}

/** Revokes all sessions except the current one. */
export async function revokeAllOtherSessions(): Promise<{ count: number }> {
  const { userId, sessionId } = await requireSession();

  // Count how many sessions will be revoked before deleting
  const toRevoke = await db.session.count({
    where: { userId, id: { not: sessionId } },
  });

  await invalidateOtherSessions(userId, sessionId);

  // CS-35: log with the total number of revoked sessions
  logEventBg({ action: "session.revoked_all", userId, sessionId, metadata: { count: toRevoke } });

  // Return the current session to confirm it is still active
  const remaining = await db.session.count({ where: { userId } });
  return { count: remaining };
}

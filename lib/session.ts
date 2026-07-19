/**
 * CS-34 — Stateful sessions backed by the database
 *
 * Cookie: `{sessionId}.{userId}.{HMAC(sessionId.userId)}`
 *   - sessionId: cuid generated at login, primary key of the Session model
 *   - userId:    the user's cuid, references User
 *   - HMAC:      SHA-256 over `{sessionId}.{userId}` with SESSION_SECRET
 *
 * Validation layers:
 *   1. Edge (proxy.ts)  — verifies the HMAC via Web Crypto API (no DB)
 *   2. Node.js (layout) — verifies the session exists and is valid in the DB
 *
 * A revoked session passes layer 1 but fails layer 2 → redirect to login.
 */

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";

const COOKIE  = "lyfx_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias em segundos

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("[session] SESSION_SECRET not set.");
  return s;
}

/** Payload to be signed: `{sessionId}.{userId}` */
function makePayload(sessionId: string, userId: string): string {
  return `${sessionId}.${userId}`;
}

/** HMAC-SHA256 over the payload. */
function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/** Encodes into a cookie value: `{sessionId}.{userId}.{HMAC}` */
function encode(sessionId: string, userId: string): string {
  return `${makePayload(sessionId, userId)}.${sign(makePayload(sessionId, userId))}`;
}

/**
 * Decodes the cookie.
 * Expected format: `{sessionId}.{userId}.{HMAC}`
 * CUIDs never contain dots, so the split is unambiguous.
 * Returns { sessionId, userId } when the HMAC is valid; null otherwise.
 */
function decode(value: string): { sessionId: string; userId: string } | null {
  // The cookie has exactly 3 dot-separated parts
  // sessionId = parts[0], userId = parts[1], HMAC = parts[2]
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [sessionId, userId, receivedSig] = parts;
  if (!sessionId || !userId || !receivedSig) return null;

  const expectedSig = sign(makePayload(sessionId, userId));

  try {
    const a = Buffer.from(receivedSig, "hex");
    const b = Buffer.from(expectedSig, "hex");
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return { sessionId, userId };
}

/** Extracts IP and User-Agent from the request headers (Node.js runtime). */
async function getClientInfo(): Promise<{ ip: string | null; userAgent: string | null }> {
  try {
    const hdrs = await headers();
    const forwarded = hdrs.get("x-forwarded-for");
    const realIp    = hdrs.get("x-real-ip");
    const ip        = forwarded ? forwarded.split(",")[0].trim() : (realIp?.trim() ?? null);
    const userAgent = hdrs.get("user-agent");
    return { ip, userAgent };
  } catch {
    return { ip: null, userAgent: null };
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Reads and validates the cookie + checks the session exists and is not expired in the DB.
 * Returns { sessionId, userId } or null.
 */
export async function getSession(): Promise<{ sessionId: string; userId: string } | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;

  const decoded = decode(raw);
  if (!decoded) return null;

  // DB check — the session may have been revoked server-side
  const session = await db.session.findUnique({
    where: { id: decoded.sessionId },
    select: { userId: true, expiresAt: true },
  });

  if (!session) return null;
  if (session.userId !== decoded.userId) return null;
  if (session.expiresAt < new Date()) {
    // Expired session — clean up
    db.session.delete({ where: { id: decoded.sessionId } }).catch(() => {});
    return null;
  }

  return decoded;
}

/** Backward-compatible shortcut — returns only the userId. */
export async function getSessionUserId(): Promise<string | null> {
  const s = await getSession();
  return s?.userId ?? null;
}

/** Updates lastSeenAt in the background (fire-and-forget, non-blocking). */
export function touchSession(sessionId: string): void {
  db.session.update({
    where: { id: sessionId },
    data:  { lastSeenAt: new Date() },
  }).catch(() => {});
}

/**
 * Creates the session in the DB and sets the cookie.
 * options.remember = false → session cookie (no maxAge)
 */
export async function setSession(
  userId: string,
  options?: { remember?: boolean },
): Promise<void> {
  const remember = options?.remember !== false;
  const expiresAt = new Date(Date.now() + MAX_AGE * 1000);
  const { ip, userAgent } = await getClientInfo();

  // Create the session record in the database
  const session = await db.session.create({
    data: { userId, ip, userAgent, expiresAt },
  });

  const jar = await cookies();
  jar.set(COOKIE, encode(session.id, userId), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/",
    ...(remember ? { maxAge: MAX_AGE } : {}),
  });
}

/**
 * Ends the current session: removes it from the DB and deletes the cookie.
 */
export async function clearSession(): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;

  if (raw) {
    const decoded = decode(raw);
    if (decoded) {
      db.session.delete({ where: { id: decoded.sessionId } }).catch(() => {});
    }
  }

  jar.delete(COOKIE);
}

/**
 * Revokes all of a user's sessions, optionally except the current one.
 * Used after a password change to force logout on other devices.
 */
export async function invalidateOtherSessions(
  userId: string,
  currentSessionId?: string,
): Promise<void> {
  await db.session.deleteMany({
    where: {
      userId,
      ...(currentSessionId ? { NOT: { id: currentSessionId } } : {}),
    },
  });
}

/**
 * CS-49: builds the login URL, preserving the current route (from the
 * x-pathname header the proxy injects) as ?redirect= so the user returns
 * where they were after signing back in.
 *
 * Open-redirect guard: only a same-site absolute path ("/...", never "//")
 * is kept — mirrors the defense in app/login/actions.ts. Falls back to a
 * bare "/login" when the header is absent or unsafe.
 */
async function loginUrl(): Promise<string> {
  try {
    const path = (await headers()).get("x-pathname");
    if (path && path.startsWith("/") && !path.startsWith("//")) {
      return `/login?redirect=${encodeURIComponent(path)}`;
    }
  } catch {
    /* headers() unavailable outside a request scope — fall through */
  }
  return "/login";
}

/**
 * CS-49: redirects to /login when unauthenticated (no session, or one that
 * expired/was revoked) instead of throwing — a thrown error surfaced the
 * custom error boundary (`lim f(t) = ∅`) on session expiry. Returns the
 * userId for authenticated callers; never returns otherwise.
 *
 * Note for callers that wrap this in try/catch: `redirect()` throws a
 * framework control-flow error — rethrow it with `unstable_rethrow(e)` at the
 * top of the catch so the redirect isn't swallowed (see app/actions/transactions.ts).
 */
export async function requireAuth(): Promise<string> {
  const s = await getSession();
  if (!s) redirect(await loginUrl());
  // Atualiza lastSeenAt em background
  touchSession(s.sessionId);
  return s.userId;
}

/** Same as requireAuth but returns the full object (for actions that need the sessionId). */
export async function requireSession(): Promise<{ userId: string; sessionId: string }> {
  const s = await getSession();
  if (!s) redirect(await loginUrl());
  touchSession(s.sessionId);
  return s;
}

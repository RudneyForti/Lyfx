/**
 * CS-34 — Sessões com estado no banco de dados
 *
 * Cookie: `{sessionId}.{userId}.{HMAC(sessionId.userId)}`
 *   - sessionId: cuid gerado no login, chave primária do model Session
 *   - userId:    cuid do usuário, referência para User
 *   - HMAC:      SHA-256 sobre `{sessionId}.{userId}` com SESSION_SECRET
 *
 * Camadas de validação:
 *   1. Edge (proxy.ts)  — verifica HMAC via Web Crypto API (sem DB)
 *   2. Node.js (layout) — verifica existência + validade da sessão no DB
 *
 * Um session revogado passa na camada 1 mas falha na camada 2 → redirect login.
 */

import { cookies, headers } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";

const COOKIE  = "lyfx_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias em segundos

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("[session] SESSION_SECRET não definida.");
  return s;
}

/** Payload a ser assinado: `{sessionId}.{userId}` */
function makePayload(sessionId: string, userId: string): string {
  return `${sessionId}.${userId}`;
}

/** HMAC-SHA256 sobre o payload. */
function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/** Codifica em valor de cookie: `{sessionId}.{userId}.{HMAC}` */
function encode(sessionId: string, userId: string): string {
  return `${makePayload(sessionId, userId)}.${sign(makePayload(sessionId, userId))}`;
}

/**
 * Decodifica o cookie.
 * Formato esperado: `{sessionId}.{userId}.{HMAC}`
 * CUIDs nunca contêm pontos, então a separação é não-ambígua.
 * Retorna { sessionId, userId } se HMAC válido; null caso contrário.
 */
function decode(value: string): { sessionId: string; userId: string } | null {
  // Cookie tem exatamente 3 partes separadas por ponto
  // sessionId = partes[0], userId = partes[1], HMAC = partes[2]
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

/** Extrai IP e User-Agent dos headers da request (Node.js runtime). */
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

// ─── API pública ───────────────────────────────────────────────────────────────

/**
 * Lê e valida o cookie + verifica se a sessão existe e não está expirada no DB.
 * Retorna { sessionId, userId } ou null.
 */
export async function getSession(): Promise<{ sessionId: string; userId: string } | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;

  const decoded = decode(raw);
  if (!decoded) return null;

  // Verificação DB — sessão pode ter sido revogada server-side
  const session = await db.session.findUnique({
    where: { id: decoded.sessionId },
    select: { userId: true, expiresAt: true },
  });

  if (!session) return null;
  if (session.userId !== decoded.userId) return null;
  if (session.expiresAt < new Date()) {
    // Sessão expirada — limpar
    db.session.delete({ where: { id: decoded.sessionId } }).catch(() => {});
    return null;
  }

  return decoded;
}

/** Atalho compatível com o código existente — retorna apenas userId. */
export async function getSessionUserId(): Promise<string | null> {
  const s = await getSession();
  return s?.userId ?? null;
}

/** Atualiza lastSeenAt em background (fire-and-forget, não bloqueia). */
export function touchSession(sessionId: string): void {
  db.session.update({
    where: { id: sessionId },
    data:  { lastSeenAt: new Date() },
  }).catch(() => {});
}

/**
 * Cria sessão no DB e define o cookie.
 * options.remember = false → session cookie (sem maxAge)
 */
export async function setSession(
  userId: string,
  options?: { remember?: boolean },
): Promise<void> {
  const remember = options?.remember !== false;
  const expiresAt = new Date(Date.now() + MAX_AGE * 1000);
  const { ip, userAgent } = await getClientInfo();

  // Cria registro de sessão no banco
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
 * Encerra a sessão atual: apaga do DB e deleta o cookie.
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
 * Revoga todas as sessões de um usuário, exceto a atual (opcional).
 * Usado após troca de senha para forçar logout nos outros dispositivos.
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

/** Throws se não autenticado. Retorna { userId, sessionId }. */
export async function requireAuth(): Promise<string> {
  const s = await getSession();
  if (!s) throw new Error("Unauthenticated");
  // Atualiza lastSeenAt em background
  touchSession(s.sessionId);
  return s.userId;
}

/** Igual a requireAuth mas retorna o objeto completo (para actions que precisam do sessionId). */
export async function requireSession(): Promise<{ userId: string; sessionId: string }> {
  const s = await getSession();
  if (!s) throw new Error("Unauthenticated");
  touchSession(s.sessionId);
  return s;
}

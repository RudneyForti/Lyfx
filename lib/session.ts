import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "lyfx_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "[session] SESSION_SECRET não definida no ambiente. " +
        "Defina SESSION_SECRET no .env para assinar cookies de sessão."
    );
  }
  return secret;
}

/** Gera assinatura HMAC-SHA256 do payload usando SESSION_SECRET. */
function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/**
 * Codifica userId em valor opaco assinado: `<userId>.<hmac_hex>`
 * O ponto final é seguro pois CUIDs não contêm pontos.
 */
function encode(userId: string): string {
  const sig = sign(userId);
  return `${userId}.${sig}`;
}

/**
 * Decodifica e verifica o valor do cookie.
 * Retorna o userId se a assinatura for válida; null caso contrário.
 */
function decode(value: string): string | null {
  const lastDot = value.lastIndexOf(".");
  if (lastDot === -1) return null;

  const userId = value.slice(0, lastDot);
  const receivedSig = value.slice(lastDot + 1);

  if (!userId || !receivedSig) return null;

  const expectedSig = sign(userId);

  // Comparação em tempo constante para evitar timing attack na verificação
  try {
    const a = Buffer.from(receivedSig, "hex");
    const b = Buffer.from(expectedSig, "hex");
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  return userId;
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value ?? null;
  if (!raw) return null;
  return decode(raw);
}

// CS-13: remember=false → session cookie (expira ao fechar browser); default = 30 dias
export async function setSession(userId: string, options?: { remember?: boolean }) {
  const jar = await cookies();
  jar.set(COOKIE, encode(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // omit maxAge when remember=false → browser session cookie
    ...(options?.remember === false ? {} : { maxAge: MAX_AGE }),
    path: "/",
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Throws se não autenticado. Usar no topo de toda server action protegida. */
export async function requireAuth(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Unauthenticated");
  return userId;
}

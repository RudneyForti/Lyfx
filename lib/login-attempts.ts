/**
 * CS-32 — Rate limiting de tentativas de login por IP
 *
 * Thresholds configuráveis via AppConfig (Studio):
 *   login_captcha_threshold  — tentativas antes de exigir CAPTCHA (default: 10)
 *   login_block_threshold    — tentativas para bloquear o IP (default: 15)
 *   login_window_minutes     — janela de tempo em minutos (default: 30)
 *
 * Verificação do CAPTCHA Cloudflare Turnstile via API server-side.
 */

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getConfigValue } from "@/lib/config";

// Defaults — usados quando as chaves não estão no AppConfig
const DEFAULT_CAPTCHA_THRESHOLD = 10;
const DEFAULT_BLOCK_THRESHOLD   = 15;
const DEFAULT_WINDOW_MINUTES    = 30;

/**
 * Extrai o IP real do cliente a partir dos headers da request.
 *
 * AVISO DE SEGURANÇA: em produção, este valor só é confiável quando o servidor
 * está atrás de um proxy reverso ou Cloudflare que sobrescreve x-forwarded-for.
 * Sem proxy, um atacante pode forjar o header e bypassar o rate limit.
 * Garantir que TURNSTILE_SECRET_KEY + proxy confiável estejam configurados em produção.
 */
export async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for");
  const realIp    = hdrs.get("x-real-ip");
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIp)    return realIp.trim();
  return "unknown";
}

/** Lê os thresholds do AppConfig (com fallback nos defaults) */
async function getThresholds() {
  const [captcha, block, window] = await Promise.all([
    getConfigValue("login_captcha_threshold", String(DEFAULT_CAPTCHA_THRESHOLD)),
    getConfigValue("login_block_threshold",   String(DEFAULT_BLOCK_THRESHOLD)),
    getConfigValue("login_window_minutes",    String(DEFAULT_WINDOW_MINUTES)),
  ]);
  return {
    captchaThreshold: Math.max(1, parseInt(captcha, 10) || DEFAULT_CAPTCHA_THRESHOLD),
    blockThreshold:   Math.max(1, parseInt(block,   10) || DEFAULT_BLOCK_THRESHOLD),
    windowMinutes:    Math.max(1, parseInt(window,  10) || DEFAULT_WINDOW_MINUTES),
  };
}

export type LoginGate =
  | { status: "ok" }
  | { status: "captcha" }
  | { status: "blocked"; retryAfterMinutes: number };

/**
 * Verifica se o IP pode tentar login.
 * Retorna:
 *   "ok"      → livre para tentar (< captchaThreshold falhas na janela)
 *   "captcha" → deve resolver CAPTCHA antes (captchaThreshold ≤ falhas < blockThreshold)
 *   "blocked" → IP bloqueado; retryAfterMinutes = tempo até desbloqueio automático
 */
export async function checkLoginGate(ip: string): Promise<LoginGate> {
  const { captchaThreshold, blockThreshold, windowMinutes } = await getThresholds();
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  const count = await db.loginAttempt.count({
    where: { ip, success: false, createdAt: { gte: since } },
  });

  if (count >= blockThreshold) {
    // Calcula tempo restante até o registro mais antigo sair da janela
    const oldest = await db.loginAttempt.findFirst({
      where: { ip, success: false, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
    });
    const unblockAt   = oldest
      ? new Date(oldest.createdAt.getTime() + windowMinutes * 60 * 1000)
      : new Date(Date.now() + windowMinutes * 60 * 1000);
    const remainingMs = Math.max(0, unblockAt.getTime() - Date.now());
    return {
      status: "blocked",
      retryAfterMinutes: Math.max(1, Math.ceil(remainingMs / 60_000)),
    };
  }

  if (count >= captchaThreshold) return { status: "captcha" };
  return { status: "ok" };
}

/**
 * Registra uma tentativa de login (bem-sucedida ou falha).
 * Realiza limpeza lazy de registros com mais de 24h.
 */
export async function recordAttempt(
  ip: string,
  email: string | undefined,
  success: boolean,
) {
  await db.loginAttempt.create({ data: { ip, email, success } });

  // Limpeza lazy — não bloqueia o login se falhar
  db.loginAttempt
    .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
    .catch(() => {});
}

/**
 * Valida o token do Cloudflare Turnstile via API server-side.
 * Em dev sem chave configurada: bypass automático (aviso no console).
 */
export async function verifyCaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[captcha] TURNSTILE_SECRET_KEY ausente — bypass automático em dev");
      return true;
    }
    console.error("[captcha] TURNSTILE_SECRET_KEY não configurada em produção");
    return false;
  }

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: secretKey, response: token }),
    });
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

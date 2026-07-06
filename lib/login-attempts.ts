/**
 * CS-32 — Per-IP login attempt rate limiting
 *
 * Thresholds configurable via AppConfig (Studio):
 *   login_captcha_threshold  — attempts before requiring CAPTCHA (default: 10)
 *   login_block_threshold    — attempts before blocking the IP (default: 15)
 *   login_window_minutes     — time window in minutes (default: 30)
 *
 * Cloudflare Turnstile CAPTCHA verification via server-side API.
 */

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getConfigValue } from "@/lib/config";

// Defaults — used when the keys are absent from AppConfig
const DEFAULT_CAPTCHA_THRESHOLD = 10;
const DEFAULT_BLOCK_THRESHOLD   = 15;
const DEFAULT_WINDOW_MINUTES    = 30;

/**
 * Extracts the client's real IP from the request headers.
 *
 * SECURITY WARNING: in production this value is only trustworthy when the
 * server sits behind a reverse proxy or Cloudflare that overwrites
 * x-forwarded-for. Without a proxy, an attacker can forge the header and
 * bypass the rate limit. Ensure TURNSTILE_SECRET_KEY + a trusted proxy are
 * configured in production.
 */
export async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  const forwarded = hdrs.get("x-forwarded-for");
  const realIp    = hdrs.get("x-real-ip");
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIp)    return realIp.trim();
  return "unknown";
}

/** Reads the thresholds from AppConfig (falling back to the defaults) */
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
 * Checks whether the IP may attempt a login.
 * Returns:
 *   "ok"      → free to try (< captchaThreshold failures in the window)
 *   "captcha" → must solve a CAPTCHA first (captchaThreshold ≤ failures < blockThreshold)
 *   "blocked" → IP blocked; retryAfterMinutes = time until automatic unblock
 */
export async function checkLoginGate(ip: string): Promise<LoginGate> {
  const { captchaThreshold, blockThreshold, windowMinutes } = await getThresholds();
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  const count = await db.loginAttempt.count({
    where: { ip, success: false, createdAt: { gte: since } },
  });

  if (count >= blockThreshold) {
    // Time remaining until the oldest record leaves the window
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
 * Records a login attempt (successful or failed).
 * Performs lazy cleanup of records older than 24h.
 */
export async function recordAttempt(
  ip: string,
  email: string | undefined,
  success: boolean,
) {
  await db.loginAttempt.create({ data: { ip, email, success } });

  // Lazy cleanup — must not block the login if it fails
  db.loginAttempt
    .deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
    .catch(() => {});
}

/**
 * Validates the Cloudflare Turnstile token via server-side API.
 * In dev without a configured key: automatic bypass (console warning).
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
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

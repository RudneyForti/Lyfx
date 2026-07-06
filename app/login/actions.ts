"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSession, clearSession, getSession } from "@/lib/session";
import {
  getClientIp,
  checkLoginGate,
  recordAttempt,
  verifyCaptcha,
} from "@/lib/login-attempts";
import { validatePasswordStrict } from "@/lib/password-strength";
import { logEvent, logEventBg } from "@/lib/audit";
import {
  setPendingTwoFactor,
  getPendingTwoFactor,
  clearPendingTwoFactor,
  verifyTotpCode,
  verifyAndConsumeBackupCode,
} from "@/lib/totp";
import { headers } from "next/headers";

async function getUserAgent(): Promise<string | null> {
  try {
    return (await headers()).get("user-agent");
  } catch {
    return null;
  }
}

export async function setup(data: { name: string; email: string; password: string }) {
  const existing = await db.user.count();
  if (existing > 0) return { error: "Conta já criada." };

  if (!data.name.trim()) return { error: "Nome obrigatório." };
  if (!data.email.trim()) return { error: "E-mail obrigatório." };

  // CS-09: server-side email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email.trim())) return { error: "E-mail inválido." };

  // CS-33: strong password policy — min. 8 chars + upper + lower + number + special
  const pwError = validatePasswordStrict(data.password);
  if (pwError) return { error: pwError };

  const hashed = await bcrypt.hash(data.password, 10);
  const user = await db.user.create({
    data: { name: data.name.trim(), email: data.email.trim().toLowerCase(), password: hashed },
  });

  await setSession(user.id);
  redirect("/dashboard");
}

export async function login(data: {
  email: string;
  password: string;
  remember?: boolean;
  redirectTo?: string;
  captchaToken?: string; // CS-32: token do Cloudflare Turnstile
}) {
  const ip = await getClientIp();
  const userAgent = await getUserAgent();

  // CS-32: check the rate limiting status before any processing
  const gate = await checkLoginGate(ip);

  if (gate.status === "blocked") {
    // CS-35: log de IP bloqueado (fire-and-forget)
    logEventBg({
      action:   "auth.login.blocked",
      ip,
      userAgent: userAgent ?? undefined,
      metadata: { email: data.email, retryAfterMinutes: gate.retryAfterMinutes },
    });
    return {
      blocked: true as const,
      retryAfterMinutes: gate.retryAfterMinutes,
    };
  }

  if (gate.status === "captcha") {
    if (!data.captchaToken) {
      // CS-35: log de CAPTCHA exigido
      logEventBg({ action: "auth.login.captcha", ip, userAgent: userAgent ?? undefined });
      return { captchaRequired: true as const };
    }
    const captchaOk = await verifyCaptcha(data.captchaToken);
    if (!captchaOk) {
      return { captchaRequired: true as const, captchaError: true as const };
    }
  }

  // Timing side-channel defense: bcrypt always runs, even when the user does not exist
  const user = await db.user.findFirst({ where: { email: data.email.trim().toLowerCase() } });
  const dummyHash = "$2a$10$X7lMWzBw0JxWxYzNq7fVOeK8Vz6v9pQZtR3sM1kL5nH2dE4gIuJwC";
  const passwordToCheck = user?.password ?? dummyHash;
  const valid = await bcrypt.compare(data.password, passwordToCheck);

  if (!user || !valid) {
    await recordAttempt(ip, data.email || undefined, false);
    // CS-35: log the failure (without revealing whether the email exists — metadata omits userId)
    logEventBg({
      action:    "auth.login.failed",
      ip,
      userAgent: userAgent ?? undefined,
      metadata:  { email: data.email },
    });
    return { error: "E-mail ou senha inválidos." };
  }

  // Successful login — check whether 2FA is active
  await recordAttempt(ip, data.email || undefined, true);

  // CS-37a: check 2FA
  const has2FA = user.twoFactorEnabled;
  if (has2FA) {
    await setPendingTwoFactor(user.id);
    return { requires2FA: true as const };
  }

  // No 2FA — create the session normally
  await setSession(user.id, { remember: data.remember ?? true });

  // CS-35: log success
  const session = await getSession();
  logEventBg({
    action:    "auth.login.success",
    userId:    user.id,
    sessionId: session?.sessionId,
    ip,
    userAgent: userAgent ?? undefined,
  });

  const target = data.redirectTo && data.redirectTo.startsWith("/") ? data.redirectTo : "/dashboard";
  redirect(target);
}

/* ── CS-37a: verify the TOTP code after the password is validated ── */
export async function verifyTwoFactor(data: {
  code:         string;
  isBackupCode: boolean;
  remember?:    boolean;
  redirectTo?:  string;
}) {
  const ip        = await getClientIp();
  const userAgent = await getUserAgent();

  // Validate the pending cookie
  const userId = await getPendingTwoFactor();
  if (!userId) return { error: "Sessão expirada. Faça login novamente." };

  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true, twoFactorBackupCodes: true },
  });
  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return { error: "2FA não configurado." };
  }

  if (data.isBackupCode) {
    // Verify the backup code
    if (!user.twoFactorBackupCodes) return { error: "Sem códigos de backup disponíveis." };
    const { valid, remainingHashes } = await verifyAndConsumeBackupCode(data.code, user.twoFactorBackupCodes);
    if (!valid) {
      logEventBg({ action: "auth.2fa.failed", userId, ip, userAgent: userAgent ?? undefined });
      return { error: "Código de backup inválido." };
    }
    // Consume the used code
    await db.user.update({
      where: { id: userId },
      data:  { twoFactorBackupCodes: JSON.stringify(remainingHashes) },
    });
    logEventBg({
      action:   "auth.2fa.backup_used",
      userId,
      ip,
      userAgent: userAgent ?? undefined,
      metadata: { remaining: remainingHashes.length },
    });
  } else {
    // Verify the TOTP code
    const valid = verifyTotpCode(user.twoFactorSecret, data.code);
    if (!valid) {
      logEventBg({ action: "auth.2fa.failed", userId, ip, userAgent: userAgent ?? undefined });
      return { error: "Código inválido. Verifique o horário do seu dispositivo." };
    }
  }

  // All good — create the session
  await clearPendingTwoFactor();
  await setSession(userId, { remember: data.remember ?? true });

  const session = await getSession();
  logEventBg({
    action:    "auth.login.success",
    userId,
    sessionId: session?.sessionId,
    ip,
    userAgent: userAgent ?? undefined,
  });

  const target = data.redirectTo && data.redirectTo.startsWith("/") ? data.redirectTo : "/dashboard";
  redirect(target);
}

export async function logout() {
  // CS-35: log before clearing the session (we still have the cookie)
  try {
    const session = await getSession();
    if (session) {
      await logEvent({
        action:    "auth.logout",
        userId:    session.userId,
        sessionId: session.sessionId,
      });
    }
  } catch { /* silencioso — logout não pode falhar */ }

  await clearSession();
  redirect("/");
}

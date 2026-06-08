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

  // CS-09: validação de formato de e-mail server-side
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email.trim())) return { error: "E-mail inválido." };

  // CS-33: política de senha forte — mínimo 8 chars + upper + lower + número + especial
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

  // CS-32: verificar status do rate limiting antes de qualquer processamento
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

  // Timing side-channel defense: bcrypt roda sempre, mesmo quando o usuário não existe
  const user = await db.user.findFirst({ where: { email: data.email.trim().toLowerCase() } });
  const dummyHash = "$2a$10$X7lMWzBw0JxWxYzNq7fVOeK8Vz6v9pQZtR3sM1kL5nH2dE4gIuJwC";
  const passwordToCheck = user?.password ?? dummyHash;
  const valid = await bcrypt.compare(data.password, passwordToCheck);

  if (!user || !valid) {
    await recordAttempt(ip, data.email || undefined, false);
    // CS-35: log de falha (sem revelar se o email existe — metadata omite userId)
    logEventBg({
      action:    "auth.login.failed",
      ip,
      userAgent: userAgent ?? undefined,
      metadata:  { email: data.email },
    });
    return { error: "E-mail ou senha inválidos." };
  }

  // Login bem-sucedido
  await recordAttempt(ip, data.email || undefined, true);
  await setSession(user.id, { remember: data.remember ?? true });

  // CS-35: log de sucesso — pega sessionId do cookie recém-criado
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

export async function logout() {
  // CS-35: log antes de limpar a sessão (ainda temos o cookie)
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

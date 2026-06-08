"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSession, clearSession } from "@/lib/session";
import {
  getClientIp,
  checkLoginGate,
  recordAttempt,
  verifyCaptcha,
} from "@/lib/login-attempts";

export async function setup(data: { name: string; email: string; password: string }) {
  const existing = await db.user.count();
  if (existing > 0) return { error: "Conta já criada." };

  if (!data.name.trim()) return { error: "Nome obrigatório." };
  if (!data.email.trim()) return { error: "E-mail obrigatório." };

  // CS-09: validação de formato de e-mail server-side
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email.trim())) return { error: "E-mail inválido." };

  if (data.password.length < 6) return { error: "Senha deve ter ao menos 6 caracteres." };

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

  // CS-32: verificar status do rate limiting antes de qualquer processamento
  const gate = await checkLoginGate(ip);

  if (gate.status === "blocked") {
    return {
      blocked: true as const,
      retryAfterMinutes: gate.retryAfterMinutes,
    };
  }

  if (gate.status === "captcha") {
    // CAPTCHA obrigatório — validar token se fornecido
    if (!data.captchaToken) {
      return { captchaRequired: true as const };
    }
    const captchaOk = await verifyCaptcha(data.captchaToken);
    if (!captchaOk) {
      // Token inválido ou expirado — pede novo CAPTCHA sem contar como tentativa
      return { captchaRequired: true as const, captchaError: true as const };
    }
  }

  // Timing side-channel defense: bcrypt roda sempre, mesmo quando o usuário não existe,
  // para evitar que a diferença de latência (~100ms vs ~5ms) revele se o e-mail é válido.
  const user = await db.user.findFirst({ where: { email: data.email.trim().toLowerCase() } });
  const dummyHash = "$2a$10$X7lMWzBw0JxWxYzNq7fVOeK8Vz6v9pQZtR3sM1kL5nH2dE4gIuJwC";
  const passwordToCheck = user?.password ?? dummyHash;
  const valid = await bcrypt.compare(data.password, passwordToCheck);

  if (!user || !valid) {
    // CS-32: registrar tentativa falha para contagem do rate limit
    await recordAttempt(ip, data.email || undefined, false);
    return { error: "E-mail ou senha inválidos." };
  }

  // Login bem-sucedido — registrar e criar sessão
  await recordAttempt(ip, data.email || undefined, true);

  // CS-13: passar remember para controlar maxAge do cookie
  await setSession(user.id, { remember: data.remember ?? true });

  // CS-13: preservar rota original após login
  const target = data.redirectTo && data.redirectTo.startsWith("/") ? data.redirectTo : "/dashboard";
  redirect(target);
}

export async function logout() {
  await clearSession();
  redirect("/");
}

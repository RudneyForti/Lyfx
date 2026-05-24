"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSession, clearSession } from "@/lib/session";

export async function setup(data: { name: string; email: string; password: string }) {
  const existing = await db.user.count();
  if (existing > 0) return { error: "Conta já criada." };

  if (!data.name.trim()) return { error: "Nome obrigatório." };
  if (!data.email.trim()) return { error: "E-mail obrigatório." };
  if (data.password.length < 6) return { error: "Senha deve ter ao menos 6 caracteres." };

  const hashed = await bcrypt.hash(data.password, 10);
  const user = await db.user.create({
    data: { name: data.name.trim(), email: data.email.trim().toLowerCase(), password: hashed },
  });

  await setSession(user.id);
  redirect("/dashboard");
}

export async function login(data: { email: string; password: string; remember?: boolean; redirectTo?: string }) {
  const user = await db.user.findFirst({ where: { email: data.email.trim().toLowerCase() } });
  if (!user) return { error: "E-mail ou senha inválidos." };

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) return { error: "E-mail ou senha inválidos." };

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

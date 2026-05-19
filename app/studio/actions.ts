"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { readFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";

const COOKIE = "lyfx_admin";

export async function adminLogin(password: string) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || password !== secret) return { error: "Senha incorreta." };
  const jar = await cookies();
  jar.set(COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 2, // 2h
    path: "/studio",
  });
  redirect("/studio");
}

export async function adminLogout() {
  const jar = await cookies();
  jar.delete(COOKIE);
  redirect("/studio");
}

export async function getAdminSession(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === "1";
}

export async function adminResetPassword(userId: string, newPassword: string) {
  if (newPassword.length < 6) return { error: "Mínimo 6 caracteres." };
  const hashed = await bcrypt.hash(newPassword, 10);
  await db.user.update({ where: { id: userId }, data: { password: hashed } });
  return { ok: true };
}

export async function adminDeleteUser(userId: string) {
  await db.user.delete({ where: { id: userId } });
  return { ok: true };
}

export async function getStudioData() {
  const [users, txCount, tagCount, budgetCount, recentTx] = await Promise.all([
    db.user.findMany({ select: { id: true, name: true, email: true, createdAt: true, avatar: true } }),
    db.transaction.count(),
    db.tag.count(),
    db.budget.count(),
    db.transaction.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, description: true, amount: true, type: true, category: true, date: true },
    }),
  ]);
  return { users, txCount, tagCount, budgetCount, recentTx };
}

export async function getDocumentation(): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "DOCUMENTATION.md");
    return await readFile(filePath, "utf-8");
  } catch {
    return "_Arquivo DOCUMENTATION.md não encontrado._";
  }
}

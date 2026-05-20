"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { readFile, stat } from "fs/promises";
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
  jar.set(COOKIE, "", { maxAge: 0, path: "/studio" });
  jar.set("lyfx_session", "", { maxAge: 0, path: "/" });
  redirect("/");
}

export async function getAdminSession(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === "1";
}

// [FIX C-4] Internal guard — all sensitive actions must call this first
async function requireAdmin() {
  const ok = await getAdminSession();
  if (!ok) throw new Error("Unauthorized.");
}

export async function adminResetPassword(userId: string, newPassword: string) {
  await requireAdmin();
  if (newPassword.length < 6) return { error: "Mínimo 6 caracteres." };
  const hashed = await bcrypt.hash(newPassword, 10);
  await db.user.update({ where: { id: userId }, data: { password: hashed } });
  return { ok: true };
}

export async function adminDeleteUser(userId: string) {
  await requireAdmin();
  // Delete all user data (cascade manually — no FK relation from User to these models)
  await db.transaction.deleteMany({ where: { userId } }); // TransactionTags cascade via onDelete
  await db.tag.deleteMany({ where: { userId } });
  await db.budget.deleteMany({ where: { userId } });
  await db.goal.deleteMany({ where: { userId } }); // GoalPayments cascade via onDelete
  await db.liability.deleteMany({ where: { userId } });
  await db.institution.deleteMany({ where: { userId } }); // Accounts cascade via onDelete
  await db.asset.deleteMany({ where: { userId } });        // AssetExpenses cascade via onDelete
  await db.settings.deleteMany({ where: { userId } });
  await db.user.delete({ where: { id: userId } });
  revalidatePath("/studio");
  return { ok: true };
}

export async function getStudioDataForUser(userId: string) {
  await requireAdmin();
  const [txCount, tagCount, budgetCount, goalCount, recentTx] = await Promise.all([
    db.transaction.count({ where: { userId } }),
    db.tag.count({ where: { userId } }),
    db.budget.count({ where: { userId } }),
    db.goal.count({ where: { userId } }),
    db.transaction.findMany({
      where: { userId },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, description: true, amount: true, type: true, category: true, date: true },
    }),
  ]);
  return { txCount, tagCount, budgetCount, goalCount, recentTx };
}

export async function adminCreateUser(data: { name: string; email: string; password: string }) {
  await requireAdmin();
  if (!data.name.trim()) return { error: "Nome obrigatório." };
  if (!data.email.trim()) return { error: "E-mail obrigatório." };
  if (data.password.length < 6) return { error: "Senha deve ter ao menos 6 caracteres." };

  const existing = await db.user.findUnique({ where: { email: data.email.trim().toLowerCase() } });
  if (existing) return { error: "E-mail já cadastrado." };

  const hashed = await bcrypt.hash(data.password, 10);
  await db.user.create({
    data: { name: data.name.trim(), email: data.email.trim().toLowerCase(), password: hashed },
  });
  revalidatePath("/studio");
  return { ok: true };
}

export async function getStudioData() {
  await requireAdmin();
  const [users, txCount, tagCount, budgetCount, goalCount, liabilityCount, goalPaymentCount, recentTx] = await Promise.all([
    db.user.findMany({ select: { id: true, name: true, email: true, createdAt: true, avatar: true } }),
    db.transaction.count(),
    db.tag.count(),
    db.budget.count(),
    db.goal.count(),
    db.liability.count(),
    db.goalPayment.count(),
    db.transaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: { id: true, description: true, amount: true, type: true, category: true, date: true },
    }),
  ]);

  const totalRecords =
    users.length + txCount + tagCount + budgetCount +
    goalCount + liabilityCount + goalPaymentCount;

  // DB file size
  let dbSizeBytes = 0;
  try {
    const dbPath = path.join(process.cwd(), "dev.db");
    const info = await stat(dbPath);
    dbSizeBytes = info.size;
  } catch { /* ignore */ }

  return {
    users, txCount, tagCount, budgetCount, goalCount, recentTx,
    userCount: users.length, totalRecords, dbSizeBytes,
  };
}

export async function getDocumentation(): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "DOCUMENTATION.md");
    return await readFile(filePath, "utf-8");
  } catch {
    return "_Arquivo DOCUMENTATION.md não encontrado._";
  }
}

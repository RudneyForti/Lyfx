"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { validatePasswordStrict } from "@/lib/password-strength";
import { requireAdmin } from "./auth";

export async function adminResetPassword(userId: string, newPassword: string) {
  await requireAdmin();
  const pwError = validatePasswordStrict(newPassword);
  if (pwError) return { error: pwError };
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
  await db.pillProgress.deleteMany({ where: { userId } }); // CS-12: evitar dados órfãos de educação
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
  const pwError = validatePasswordStrict(data.password);
  if (pwError) return { error: pwError };

  const existing = await db.user.findUnique({ where: { email: data.email.trim().toLowerCase() } });
  if (existing) return { error: "E-mail já cadastrado." };

  const hashed = await bcrypt.hash(data.password, 10);

  // Assign default plan automatically
  const defaultPlan = await db.plan.findFirst({ where: { isDefault: true } });

  const newUser = await db.user.create({
    data: {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: hashed,
      ...(defaultPlan ? { planId: defaultPlan.id } : {}),
    },
  });

  // Default welcome notification for every new user
  await db.notification.create({
    data: {
      userId: newUser.id,
      title: "Bem-vindo ao Lyfx!",
      body: `Olá, ${newUser.name}! Seu ambiente está pronto. Explore os módulos de orçamento, metas e saúde financeira para começar a organizar sua vida financeira.`,
      type: "success",
      link: "/dashboard",
      fingerprint: null,
    },
  });

  revalidatePath("/studio");
  return { ok: true };
}

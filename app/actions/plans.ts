"use server";

import { db } from "@/lib/db";
import { ALL_MODULE_KEYS, ALL_MODULES } from "@/lib/modules";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/studio/actions";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PlanWithModules {
  id: string;
  name: string;
  description: string | null;
  color: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  modules: string[];
  userCount: number;
}

// ── Read ─────────────────────────────────────────────────────────────────────

export async function getPlans(): Promise<PlanWithModules[]> {
  const plans = await db.plan.findMany({
    include: {
      modules: true,
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return plans.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    color: p.color,
    isDefault: p.isDefault,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    modules: p.modules.map((m) => m.module),
    userCount: p._count.users,
  }));
}

export async function getPlanById(id: string): Promise<PlanWithModules | null> {
  const p = await db.plan.findUnique({
    where: { id },
    include: {
      modules: true,
      _count: { select: { users: true } },
    },
  });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    color: p.color,
    isDefault: p.isDefault,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    modules: p.modules.map((m) => m.module),
    userCount: p._count.users,
  };
}

// Returns the module keys for a given user (by userId).
// Falls back to ALL modules if user has no plan assigned.
export async function getUserModules(userId: string): Promise<string[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { plan: { include: { modules: true } } },
  });
  if (!user?.plan) return ALL_MODULE_KEYS;
  return user.plan.modules.map((m) => m.module);
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function createPlan(data: {
  name: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
  modules: string[];
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  await requireAdmin();
  try {
    if (!data.name.trim()) return { ok: false, error: "Nome obrigatório" };

    const plan = await db.plan.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        color: data.color || "#22D3EE",
        isDefault: data.isDefault ?? false,
        modules: {
          create: data.modules.map((m) => ({ module: m })),
        },
      },
    });

    // If this is the new default, unset others
    if (data.isDefault) {
      await db.plan.updateMany({
        where: { id: { not: plan.id }, isDefault: true },
        data: { isDefault: false },
      });
    }

    revalidatePath("/studio");
    return { ok: true, id: plan.id };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unique constraint")) return { ok: false, error: "Já existe um plano com esse nome" };
    return { ok: false, error: msg };
  }
}

// ── Update ───────────────────────────────────────────────────────────────────

export async function updatePlan(
  id: string,
  data: {
    name?: string;
    description?: string;
    color?: string;
    isDefault?: boolean;
    modules?: string[];
  }
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  try {
    await db.$transaction(async (tx) => {
      await tx.plan.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name.trim() }),
          ...(data.description !== undefined && { description: data.description.trim() || null }),
          ...(data.color !== undefined && { color: data.color }),
          ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        },
      });

      if (data.modules !== undefined) {
        await tx.planModule.deleteMany({ where: { planId: id } });
        await tx.planModule.createMany({
          data: data.modules.map((m) => ({ planId: id, module: m })),
        });
      }

      if (data.isDefault) {
        await tx.plan.updateMany({
          where: { id: { not: id }, isDefault: true },
          data: { isDefault: false },
        });
      }
    });

    revalidatePath("/studio");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Delete ───────────────────────────────────────────────────────────────────

export async function deletePlan(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  try {
    await db.plan.delete({ where: { id } });
    revalidatePath("/studio");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// Move all users from one plan to another, then delete the source plan
export async function migrateAndDeletePlan(
  fromId: string,
  toId: string | null
): Promise<{ ok: boolean; moved: number; error?: string }> {
  await requireAdmin();
  try {
    const result = await db.user.updateMany({
      where: { planId: fromId },
      data: { planId: toId },
    });
    await db.plan.delete({ where: { id: fromId } });
    revalidatePath("/studio");
    return { ok: true, moved: result.count };
  } catch (e: unknown) {
    return { ok: false, moved: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Assign user to plan ───────────────────────────────────────────────────────

export async function assignUserToPlan(
  userId: string,
  planId: string | null
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  try {
    await db.user.update({
      where: { id: userId },
      data: { planId },
    });
    revalidatePath("/studio");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Seed Insider plan ─────────────────────────────────────────────────────────

export async function ensureInsiderPlan(): Promise<{ ok: boolean; created: boolean; error?: string }> {
  await requireAdmin();
  try {
    const existing = await db.plan.findFirst({ where: { name: "Insider" } });
    if (existing) return { ok: true, created: false };

    // Insider = todos os módulos, inclusive os betas
    await db.plan.create({
      data: {
        name: "Insider",
        description: "Acesso antecipado a tudo — inclui funcionalidades beta",
        color: "#A78BFA",
        isDefault: false,
        modules: { create: ALL_MODULE_KEYS.map((k) => ({ module: k })) },
      },
    });

    revalidatePath("/studio");
    return { ok: true, created: true };
  } catch (e: unknown) {
    return { ok: false, created: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Seed default plan ─────────────────────────────────────────────────────────

export async function ensureDefaultPlan(): Promise<{ ok: boolean; created: boolean; error?: string }> {
  await requireAdmin();
  try {
    const existing = await db.plan.findFirst({ where: { isDefault: true } });
    if (existing) return { ok: true, created: false };

    // Full = todos os módulos estáveis (sem beta)
    const stableKeys = ALL_MODULES.filter(m => !m.isBeta).map(m => m.key);

    await db.plan.create({
      data: {
        name: "Full",
        description: "Acesso completo a todos os módulos estáveis",
        color: "#22D3EE",
        isDefault: true,
        modules: {
          create: stableKeys.map((k) => ({ module: k })),
        },
      },
    });

    revalidatePath("/studio");
    return { ok: true, created: true };
  } catch (e: unknown) {
    return { ok: false, created: false, error: e instanceof Error ? e.message : String(e) };
  }
}

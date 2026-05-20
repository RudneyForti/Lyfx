"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import type { InstitutionType, AccountType, Institution, AccountForSelect } from "@/lib/institutions";

// ── Read ──────────────────────────────────────────────────────────────

export async function getInstitutions(): Promise<Institution[]> {
  const userId = await requireAuth();
  return db.institution.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { accounts: { orderBy: { name: "asc" } } },
  }) as Promise<Institution[]>;
}

export async function getAccountsForSelect(): Promise<AccountForSelect[]> {
  const userId = await requireAuth();
  const accounts = await db.account.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { institution: { select: { name: true } } },
  });
  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    institutionName: a.institution.name,
  }));
}

// ── Institution CRUD ──────────────────────────────────────────────────

export async function createInstitution(data: {
  name: string;
  type: InstitutionType;
  color: string;
  icon: string;
  notes?: string;
}) {
  const userId = await requireAuth();
  if (!data.name.trim()) return { error: "Nome obrigatório." };
  await db.institution.create({ data: { ...data, name: data.name.trim(), userId } });
  revalidatePath("/institutions");
  return { ok: true };
}

export async function updateInstitution(
  id: string,
  data: { name?: string; type?: InstitutionType; color?: string; icon?: string; notes?: string }
) {
  const userId = await requireAuth();
  await db.institution.update({ where: { id, userId }, data });
  revalidatePath("/institutions");
  return { ok: true };
}

export async function deleteInstitution(id: string) {
  const userId = await requireAuth();
  // Clear institutionId from linked liabilities
  await db.liability.updateMany({ where: { userId, institutionId: id }, data: { institutionId: null } });
  // Clear accountId from transactions for all accounts of this institution
  const accounts = await db.account.findMany({ where: { institutionId: id, userId } });
  for (const acc of accounts) {
    await db.transaction.updateMany({ where: { userId, accountId: acc.id }, data: { accountId: null } });
  }
  // Delete institution (cascades to accounts)
  await db.institution.delete({ where: { id, userId } });
  revalidatePath("/institutions");
  return { ok: true };
}

// ── Account CRUD ──────────────────────────────────────────────────────

export async function createAccount(data: {
  institutionId: string;
  name: string;
  type: AccountType;
  balance: number;
  limit?: number;
  notes?: string;
}) {
  const userId = await requireAuth();
  if (!data.name.trim()) return { error: "Nome obrigatório." };
  await db.account.create({ data: { ...data, name: data.name.trim(), userId } });
  revalidatePath("/institutions");
  return { ok: true };
}

export async function updateAccount(
  id: string,
  data: { name?: string; type?: AccountType; balance?: number; limit?: number; notes?: string }
) {
  const userId = await requireAuth();
  await db.account.update({ where: { id, userId }, data });
  revalidatePath("/institutions");
  return { ok: true };
}

export async function deleteAccount(id: string) {
  const userId = await requireAuth();
  // Clear accountId from transactions
  await db.transaction.updateMany({ where: { userId, accountId: id }, data: { accountId: null } });
  await db.account.delete({ where: { id, userId } });
  revalidatePath("/institutions");
  return { ok: true };
}

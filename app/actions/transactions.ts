"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { TransactionCategory, TransactionType, DRESummary, Recurrence, Transaction } from "@/lib/types";

const INCLUDE_TAGS = {
  tags: { include: { tag: true } },
} as const;

// [CS-29] Tipo inferido do resultado do findMany com INCLUDE_TAGS — elimina any
type TxWithTags = Awaited<ReturnType<typeof db.transaction.findMany<{ include: typeof INCLUDE_TAGS }>>>[number];

function mapTx(tx: TxWithTags): Transaction {
  return {
    ...tx,
    type: tx.type as TransactionType,
    category: tx.category as TransactionCategory,
    recurrence: tx.recurrence as Recurrence,
    tags: tx.tags?.map((tt) => tt.tag) ?? [],
  };
}

export async function createTransaction(data: {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  subcategory?: string;
  notes?: string;
  recurrence?: Recurrence;
  recurrenceEndsAt?: string;
  context?: string;
  reimbursable?: boolean;
  accountId?: string;
  tagIds?: string[];
}): Promise<{ ok: true } | { error: string }> {
  try {
    const userId = await requireAuth();
    const { tagIds, recurrenceEndsAt, ...rest } = data;
    await db.transaction.create({
      data: {
        ...rest,
        userId,
        date: new Date(rest.date),
        recurrenceEndsAt: recurrenceEndsAt ? new Date(recurrenceEndsAt) : undefined,
        tags: tagIds?.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
    });
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao criar transação." };
  }
}

export async function getTransactions(params?: {
  month?: number;
  year?: number;
}): Promise<Transaction[]> {
  const userId = await requireAuth();
  const where: Record<string, unknown> = { userId };

  if (params?.month !== undefined && params?.year !== undefined) {
    const start = new Date(params.year, params.month - 1, 1);
    const end = new Date(params.year, params.month, 0, 23, 59, 59);
    where.date = { gte: start, lte: end };
  }

  const results = await db.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    include: INCLUDE_TAGS,
  });

  return results.map(mapTx);
}

export async function updateTransaction(
  id: string,
  data: {
    date: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: TransactionCategory;
    subcategory?: string;
    notes?: string;
    recurrence?: Recurrence;
    context?: string;
    reimbursable?: boolean;
    tagIds?: string[];
  }
): Promise<{ ok: true } | { error: string }> {
  try {
    const userId = await requireAuth();
    const { tagIds, ...rest } = data;
    await db.transaction.update({
      where: { id, userId },
      data: {
        ...rest,
        date: new Date(rest.date),
        tags:
          tagIds !== undefined
            ? { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) }
            : undefined,
      },
    });
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/planning");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao atualizar transação." };
  }
}

export async function updateFutureInstallments(
  groupId: string,
  data: {
    baseDescription: string;
    amount: number;
    type: TransactionType;
    category: TransactionCategory;
    notes?: string;
    tagIds?: string[];
  }
) {
  const userId = await requireAuth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const future = await db.transaction.findMany({
    where: { installmentGroupId: groupId, userId, date: { gte: today } },
    select: { id: true, installmentNumber: true, installmentTotal: true },
  });

  for (const inst of future) {
    // [FIX M-2] Guard: inst already came from a userId-filtered query, but we
    // separate scalar and relation updates — updateMany can't handle nested writes.
    const scalarData = {
      description: `${data.baseDescription} (${inst.installmentNumber}/${inst.installmentTotal})`,
      amount: data.amount,
      type: data.type,
      category: data.category,
      notes: data.notes,
    };
    await db.transaction.updateMany({ where: { id: inst.id, userId }, data: scalarData });
    if (data.tagIds !== undefined) {
      await db.transactionTag.deleteMany({ where: { transactionId: inst.id } });
      if (data.tagIds.length > 0) {
        await db.transactionTag.createMany({
          data: data.tagIds.map((tagId) => ({ transactionId: inst.id, tagId })),
        });
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/projections");
}

export async function deleteTransaction(id: string): Promise<{ ok: true } | { error: string }> {
  try {
    const userId = await requireAuth();
    // [FIX B-2] Use deleteMany — delete() ignores non-PK fields in where
    await db.transaction.deleteMany({ where: { id, userId } });
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/planning");
    revalidatePath("/projections");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao excluir transação." };
  }
}

export async function deleteInstallmentGroup(groupId: string): Promise<{ ok: true } | { error: string }> {
  try {
    const userId = await requireAuth();
    await db.transaction.deleteMany({ where: { installmentGroupId: groupId, userId } });
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/planning");
    revalidatePath("/projections");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao excluir parcelas." };
  }
}

export async function createInstallments(data: {
  firstDate: string;           // ISO date of first installment
  description: string;
  totalAmount: number;
  count: number;               // number of installments
  type: TransactionType;
  category: TransactionCategory;
  notes?: string;
  tagIds?: string[];
}) {
  const userId = await requireAuth();
  const groupId = randomUUID();
  // CS-03: Math.floor nas n-1 parcelas; última parcela absorve o resíduo
  // (garante que a soma exata seja sempre igual a totalAmount)
  const baseAmount = Math.floor((data.totalAmount / data.count) * 100) / 100;
  const lastAmount = Math.round((data.totalAmount - baseAmount * (data.count - 1)) * 100) / 100;

  const firstDate = new Date(data.firstDate);

  const records = Array.from({ length: data.count }, (_, i) => {
    const date = new Date(firstDate.getFullYear(), firstDate.getMonth() + i, firstDate.getDate());
    return {
      userId,
      date,
      description: `${data.description} (${i + 1}/${data.count})`,
      amount: i === data.count - 1 ? lastAmount : baseAmount,
      type: data.type,
      category: data.category,
      notes: data.notes,
      recurrence: "once" as const,
      installmentGroupId: groupId,
      installmentNumber: i + 1,
      installmentTotal: data.count,
    };
  });

  // createMany doesn't support nested tag relations, so we create individually if tags exist
  if (data.tagIds?.length) {
    for (const record of records) {
      await db.transaction.create({
        data: {
          ...record,
          tags: { create: data.tagIds.map(tagId => ({ tagId })) },
        },
      });
    }
  } else {
    await db.transaction.createMany({ data: records });
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/projections");
}

export async function getDRESummary(month?: number, year?: number): Promise<DRESummary> {
  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();

  const transactions = await getTransactions({ month: m, year: y });

  const sum = (type: TransactionType, category: TransactionCategory) =>
    transactions
      .filter((t) => t.type === type && t.category === category)
      .reduce((acc, t) => acc + t.amount, 0);

  const creditFixed    = sum("credit", "credit_fixed");
  const creditVariable = sum("credit", "credit_variable");
  const creditTotal    = creditFixed + creditVariable;

  const debitFixed       = sum("debit", "debit_fixed");
  const debitVariable    = sum("debit", "debit_variable");
  const debitCommitted   = sum("debit", "debit_committed");
  const debitLongterm    = sum("debit", "debit_longterm");
  const debitSeasonal    = sum("debit", "debit_seasonal");
  const debitUnexpected  = sum("debit", "debit_unexpected");
  const debitIntentional = sum("debit", "debit_intentional");
  const debitTotal =
    debitFixed + debitVariable + debitCommitted +
    debitLongterm + debitSeasonal + debitUnexpected + debitIntentional;

  const afterFixed     = creditTotal - debitFixed;
  const afterVariable  = afterFixed  - debitVariable;
  const afterCommitted = afterVariable - debitCommitted;
  const net            = creditTotal - debitTotal;

  return {
    credits: { fixed: creditFixed, variable: creditVariable, total: creditTotal },
    debits: {
      fixed: debitFixed,
      variable: debitVariable,
      committed: debitCommitted,
      longterm: debitLongterm,
      seasonal: debitSeasonal,
      unexpected: debitUnexpected,
      intentional: debitIntentional,
      total: debitTotal,
    },
    margins: { afterFixed, afterVariable, afterCommitted, net },
    saved: debitLongterm,
    result: net,
  };
}

// ── Reembolso ────────────────────────────────────────────────────────────────

export async function getReimbursables(): Promise<Transaction[]> {
  const userId = await requireAuth();
  const raw = await db.transaction.findMany({
    where: { reimbursable: true, userId },
    orderBy: { date: "desc" },
    include: INCLUDE_TAGS,
  });
  return raw.map(mapTx);
}

export async function markReimbursed(id: string): Promise<void> {
  const userId = await requireAuth();
  await db.transaction.update({
    where: { id, userId },
    data: { reimbursedAt: new Date() },
  });
  revalidatePath("/reimbursements");
}

export async function unmarkReimbursed(id: string): Promise<void> {
  const userId = await requireAuth();
  await db.transaction.update({
    where: { id, userId },
    data: { reimbursedAt: null },
  });
  revalidatePath("/reimbursements");
}

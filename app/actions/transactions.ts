"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { TransactionCategory, TransactionType, DRESummary, Recurrence, Transaction } from "@/lib/types";

const INCLUDE_TAGS = {
  tags: { include: { tag: true } },
} as const;

function mapTx(tx: any): Transaction {
  return {
    ...tx,
    type: tx.type as TransactionType,
    category: tx.category as TransactionCategory,
    recurrence: tx.recurrence as Recurrence,
    tags: tx.tags?.map((tt: any) => tt.tag) ?? [],
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
  tagIds?: string[];
}) {
  const { tagIds, recurrenceEndsAt, ...rest } = data;
  await db.transaction.create({
    data: {
      ...rest,
      date: new Date(rest.date),
      recurrenceEndsAt: recurrenceEndsAt ? new Date(recurrenceEndsAt) : undefined,
      tags: tagIds?.length
        ? { create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
  });
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

export async function getTransactions(params?: {
  month?: number;
  year?: number;
}): Promise<Transaction[]> {
  const where: Record<string, unknown> = {};

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
) {
  const { tagIds, ...rest } = data;
  await db.transaction.update({
    where: { id },
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const future = await db.transaction.findMany({
    where: { installmentGroupId: groupId, date: { gte: today } },
    select: { id: true, installmentNumber: true, installmentTotal: true },
  });

  for (const inst of future) {
    await db.transaction.update({
      where: { id: inst.id },
      data: {
        description: `${data.baseDescription} (${inst.installmentNumber}/${inst.installmentTotal})`,
        amount: data.amount,
        type: data.type,
        category: data.category,
        notes: data.notes,
        tags: data.tagIds !== undefined
          ? { deleteMany: {}, create: data.tagIds.map(tagId => ({ tagId })) }
          : undefined,
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/projections");
}

export async function deleteTransaction(id: string) {
  // If this transaction belongs to an installment group, delete only this one
  await db.transaction.delete({ where: { id } });
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/planning");
  revalidatePath("/projections");
}

export async function deleteInstallmentGroup(groupId: string) {
  await db.transaction.deleteMany({ where: { installmentGroupId: groupId } });
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/planning");
  revalidatePath("/projections");
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
  const groupId = randomUUID();
  const perInstallment = Math.ceil((data.totalAmount / data.count) * 100) / 100;
  const firstDate = new Date(data.firstDate);

  const records = Array.from({ length: data.count }, (_, i) => {
    const date = new Date(firstDate.getFullYear(), firstDate.getMonth() + i, firstDate.getDate());
    return {
      date,
      description: `${data.description} (${i + 1}/${data.count})`,
      amount: perInstallment,
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

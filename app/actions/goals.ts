"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { parseLocalDate } from "@/lib/dates";
import { requireAuth } from "@/lib/session";

export async function getGoals() {
  const userId = await requireAuth();
  return db.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { payments: { orderBy: { dueDate: "asc" } } },
  });
}

export async function createGoal(data: {
  name: string;
  description?: string;
  targetAmount: number;
  deadline: string;
  color: string;
  icon: string;
}) {
  const userId = await requireAuth();
  const deadline = parseLocalDate(data.deadline);
  const now = new Date();

  // CS-05: reject a deadline in the past (compare with the start of the current month)
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (deadline < startOfCurrentMonth) {
    return { error: "O prazo deve ser uma data futura." };
  }

  // months from now to deadline (at least 1)
  const months = Math.max(
    1,
    (deadline.getFullYear() - now.getFullYear()) * 12 +
      (deadline.getMonth() - now.getMonth())
  );

  // [FIX M-3] Last payment absorbs rounding residual so total == targetAmount
  const baseAmount = Math.floor(data.targetAmount / months);
  const lastAmount = data.targetAmount - baseAmount * (months - 1);

  const goal = await db.goal.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      targetAmount: data.targetAmount,
      deadline,
      color: data.color,
      icon: data.icon,
      monthlyAmount: baseAmount,
    },
  });

  // Generate monthly payment charges
  const payments = [];
  for (let i = 0; i < months; i++) {
    const due = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
    payments.push({
      goalId: goal.id,
      dueDate: due,
      amount: i === months - 1 ? lastAmount : baseAmount,
    });
  }
  await db.goalPayment.createMany({ data: payments });

  revalidatePath("/goals");
  return goal;
}

export async function markPayment(paymentId: string, paid: boolean) {
  const userId = await requireAuth();

  // [FIX C-1] Verify ownership via Goal relation before updating
  const payment = await db.goalPayment.findFirst({
    where: { id: paymentId, goal: { userId } },
  });
  if (!payment) throw new Error("Pagamento não encontrado.");

  await db.goalPayment.update({
    where: { id: payment.id },
    data: { paid, paidAt: paid ? new Date() : null },
  });

  // Update goal currentAmount
  const allPaid = await db.goalPayment.findMany({
    where: { goalId: payment.goalId, paid: true },
  });
  const currentAmount = allPaid.reduce((s, p) => s + p.amount, 0);

  const goal = await db.goal.findUnique({ where: { id: payment.goalId } });
  const status =
    currentAmount >= (goal?.targetAmount ?? 0) ? "completed" : "active";

  await db.goal.update({
    where: { id: payment.goalId },
    data: { currentAmount, status },
  });

  revalidatePath("/goals");
}

export async function deleteGoal(id: string) {
  const userId = await requireAuth();
  // [FIX B-2] Use deleteMany so userId filter is applied (delete ignores non-PK fields)
  await db.goal.deleteMany({ where: { id, userId } });
  revalidatePath("/goals");
}

export async function getMonthlyBalance() {
  const userId = await requireAuth();
  const now = new Date();
  const results = [];

  for (let i = 2; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

    const txs = await db.transaction.findMany({
      where: { userId, date: { gte: start, lte: end } },
      select: { amount: true, type: true },
    });

    // [FIX C-2] Correct type values: "credit" / "debit" (not "income" / "expense")
    const income  = txs.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    results.push(income - expense);
  }

  const avg = results.reduce((s, v) => s + v, 0) / results.length;
  return isNaN(avg) ? 0 : avg;
}

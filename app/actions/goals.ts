"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function getGoals() {
  return db.goal.findMany({
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
  const deadline = new Date(data.deadline);
  const now = new Date();

  // months from now to deadline (at least 1)
  const months = Math.max(
    1,
    (deadline.getFullYear() - now.getFullYear()) * 12 +
      (deadline.getMonth() - now.getMonth())
  );

  const monthlyAmount = Math.ceil(data.targetAmount / months);

  const goal = await db.goal.create({
    data: {
      name: data.name,
      description: data.description,
      targetAmount: data.targetAmount,
      deadline,
      color: data.color,
      icon: data.icon,
      monthlyAmount,
    },
  });

  // Generate monthly payment charges
  const payments = [];
  for (let i = 0; i < months; i++) {
    const due = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
    payments.push({ goalId: goal.id, dueDate: due, amount: monthlyAmount });
  }
  await db.goalPayment.createMany({ data: payments });

  revalidatePath("/goals");
  return goal;
}

export async function markPayment(paymentId: string, paid: boolean) {
  const payment = await db.goalPayment.update({
    where: { id: paymentId },
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
  await db.goal.delete({ where: { id } });
  revalidatePath("/goals");
}

export async function getMonthlyBalance() {
  const now = new Date();
  const results = [];

  for (let i = 2; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

    const txs = await db.transaction.findMany({
      where: { date: { gte: start, lte: end } },
      select: { amount: true, type: true },
    });

    const income = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    results.push(income - expense);
  }

  const avg = results.reduce((s, v) => s + v, 0) / results.length;
  return isNaN(avg) ? 0 : avg;
}

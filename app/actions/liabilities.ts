"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export type LiabilityType =
  | "cheque_especial"
  | "rotativo"
  | "emprestimo"
  | "financiamento"
  | "outro";

export interface Liability {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  creditor: string | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getLiabilities(): Promise<Liability[]> {
  const userId = await requireAuth();
  return db.liability.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getActiveLiabilities(): Promise<Liability[]> {
  const userId = await requireAuth();
  return db.liability.findMany({
    where: { userId, status: "active" },
    orderBy: { interestRate: "desc" }, // avalanche order
  });
}

export async function createLiability(data: {
  name: string;
  type: LiabilityType;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  creditor?: string;
  notes?: string;
}): Promise<Liability> {
  const userId = await requireAuth();
  const liability = await db.liability.create({ data: { ...data, userId } });
  revalidatePath("/liabilities");
  revalidatePath("/goals");
  return liability;
}

export async function updateLiability(
  id: string,
  data: Partial<{
    name: string;
    type: string;
    currentBalance: number;
    interestRate: number;
    minimumPayment: number;
    creditor: string;
    notes: string;
    status: string;
  }>
): Promise<Liability> {
  const userId = await requireAuth();
  const liability = await db.liability.update({ where: { id, userId }, data });
  revalidatePath("/liabilities");
  revalidatePath("/goals");
  return liability;
}

export async function deleteLiability(id: string) {
  const userId = await requireAuth();
  await db.liability.delete({ where: { id, userId } });
  revalidatePath("/liabilities");
  revalidatePath("/goals");
}

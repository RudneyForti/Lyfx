"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

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
  return db.liability.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getActiveLiabilities(): Promise<Liability[]> {
  return db.liability.findMany({
    where: { status: "active" },
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
  const liability = await db.liability.create({ data });
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
  const liability = await db.liability.update({ where: { id }, data });
  revalidatePath("/liabilities");
  revalidatePath("/goals");
  return liability;
}

export async function deleteLiability(id: string) {
  await db.liability.delete({ where: { id } });
  revalidatePath("/liabilities");
  revalidatePath("/goals");
}


"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export async function getTags() {
  const userId = await requireAuth();
  return db.tag.findMany({ where: { userId }, orderBy: { name: "asc" } });
}

export async function createTag(data: { name: string; color: string; icon: string }) {
  const userId = await requireAuth();
  const tag = await db.tag.create({ data: { ...data, userId } });
  revalidatePath("/tags");
  revalidatePath("/transactions");
  return tag;
}

export async function updateTag(id: string, data: { name?: string; color?: string; icon?: string }) {
  const userId = await requireAuth();
  const tag = await db.tag.update({ where: { id, userId }, data });
  revalidatePath("/tags");
  revalidatePath("/transactions");
  return tag;
}

export async function deleteTag(id: string) {
  const userId = await requireAuth();
  await db.tag.delete({ where: { id, userId } });
  revalidatePath("/tags");
  revalidatePath("/transactions");
}

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function getTags() {
  return db.tag.findMany({ orderBy: { name: "asc" } });
}

export async function createTag(data: { name: string; color: string; icon: string }) {
  const tag = await db.tag.create({ data });
  revalidatePath("/tags");
  revalidatePath("/transactions");
  return tag;
}

export async function updateTag(id: string, data: { name?: string; color?: string; icon?: string }) {
  const tag = await db.tag.update({ where: { id }, data });
  revalidatePath("/tags");
  revalidatePath("/transactions");
  return tag;
}

export async function deleteTag(id: string) {
  await db.tag.delete({ where: { id } });
  revalidatePath("/tags");
  revalidatePath("/transactions");
}

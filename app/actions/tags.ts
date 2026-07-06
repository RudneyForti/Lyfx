"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { Prisma } from "@/lib/generated/prisma/client";

export async function getTags() {
  const userId = await requireAuth();
  return db.tag.findMany({ where: { userId }, orderBy: { name: "asc" } });
}

export async function createTag(data: { name: string; color: string; icon: string }) {
  const userId = await requireAuth();
  // CS-07: catch the unique constraint violation (userId, name) and return a friendly error
  try {
    const tag = await db.tag.create({ data: { ...data, userId } });
    revalidatePath("/tags");
    revalidatePath("/transactions");
    return tag;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Já existe uma tag com esse nome." };
    }
    throw err;
  }
}

export async function updateTag(id: string, data: { name?: string; color?: string; icon?: string }) {
  const userId = await requireAuth();
  // CS-07: catch P2002 in updateTag too (rename to an already-existing name)
  try {
    const tag = await db.tag.update({ where: { id, userId }, data });
    revalidatePath("/tags");
    revalidatePath("/transactions");
    return tag;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Já existe uma tag com esse nome." };
    }
    throw err;
  }
}

export async function deleteTag(id: string) {
  const userId = await requireAuth();
  // CS-07: deleteMany avoids a P2025 HTTP 500 on IDOR attempts (silently returns 0 rows)
  await db.tag.deleteMany({ where: { id, userId } });
  revalidatePath("/tags");
  revalidatePath("/transactions");
}

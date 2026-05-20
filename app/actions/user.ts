"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/session";

async function requireUser() {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Não autenticado.");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuário não encontrado.");
  return user;
}

export async function getProfile() {
  return requireUser();
}

export async function updateProfile(data: {
  name: string;
  email?: string;
  age?: number | null;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  street?: string | null;
  streetNumber?: string | null;
  country?: string | null;
  avatar?: string | null;
}) {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data });
  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

export async function changePassword(data: {
  current: string;
  next: string;
}) {
  const user = await requireUser();
  const valid = await bcrypt.compare(data.current, user.password);
  if (!valid) return { error: "Senha atual incorreta." };
  if (data.next.length < 6) return { error: "Nova senha deve ter ao menos 6 caracteres." };

  const hashed = await bcrypt.hash(data.next, 10);
  await db.user.update({ where: { id: user.id }, data: { password: hashed } });
  return { ok: true };
}

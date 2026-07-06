"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAuth, requireSession, invalidateOtherSessions } from "@/lib/session";
import { validatePasswordStrict } from "@/lib/password-strength"; // CS-33
import { logEventBg } from "@/lib/audit";                         // CS-35

// [CS-29] local requireUser fetches the full User object (needed for changePassword).
async function requireUser() {
  const userId = await requireAuth();
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
  const { userId, sessionId } = await requireSession();
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuário não encontrado.");

  const valid = await bcrypt.compare(data.current, user.password);
  if (!valid) return { error: "Senha atual incorreta." };
  // CS-33: strong password policy
  const pwError = validatePasswordStrict(data.next);
  if (pwError) return { error: pwError };

  const hashed = await bcrypt.hash(data.next, 10);
  await db.user.update({ where: { id: user.id }, data: { password: hashed } });

  // CS-34: revoke all other sessions after a password change (security)
  await invalidateOtherSessions(userId, sessionId);

  // CS-35: log de troca de senha (fire-and-forget)
  logEventBg({ action: "auth.password.changed", userId, sessionId });

  return { ok: true };
}

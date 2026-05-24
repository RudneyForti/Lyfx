import { cookies } from "next/headers";

const COOKIE = "lyfx_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value ?? null;
}

// CS-13: remember=false → session cookie (expira ao fechar browser); default = 30 dias
export async function setSession(userId: string, options?: { remember?: boolean }) {
  const jar = await cookies();
  jar.set(COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // omit maxAge when remember=false → browser session cookie
    ...(options?.remember === false ? {} : { maxAge: MAX_AGE }),
    path: "/",
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Throws if not authenticated. Use at the top of every server action. */
export async function requireAuth(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Unauthenticated");
  return userId;
}

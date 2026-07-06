"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Studio admin session — HMAC-signed cookie with embedded expiry.
 *
 * Formato: `{expiresAtMs}.{HMAC_SHA256("lyfx_admin.{expiresAtMs}", SESSION_SECRET)}`
 *
 * Unlike the old static value "1", the cookie is now unforgeable and
 * expires server-side (not just via the browser maxAge). Global revocation:
 * rotating SESSION_SECRET immediately invalidates all admin sessions.
 */

const COOKIE = "lyfx_admin";
const TTL_MS = 60 * 60 * 2 * 1000; // 2h

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("[studio/auth] SESSION_SECRET não definida.");
  return s;
}

function sign(expiresAtMs: number): string {
  return createHmac("sha256", getSecret())
    .update(`lyfx_admin.${expiresAtMs}`)
    .digest("hex");
}

function verify(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 2) return false;
  const [expStr, receivedSig] = parts;
  const expiresAtMs = Number(expStr);
  if (!Number.isFinite(expiresAtMs)) return false;
  if (expiresAtMs < Date.now()) return false;

  try {
    const a = Buffer.from(receivedSig, "hex");
    const b = Buffer.from(sign(expiresAtMs), "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function adminLogin(password: string) {
  const secret = process.env.ADMIN_SECRET ?? "";
  const a = Buffer.from(password.padEnd(secret.length));
  const b = Buffer.from(secret.padEnd(password.length));
  const valid = password.length === secret.length && secret.length > 0 && timingSafeEqual(a, b);
  if (!valid) return { error: "Senha incorreta." };

  const expiresAtMs = Date.now() + TTL_MS;
  const jar = await cookies();
  jar.set(COOKIE, `${expiresAtMs}.${sign(expiresAtMs)}`, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: TTL_MS / 1000,
    path: "/studio",
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/studio");
}

export async function adminLogout() {
  const jar = await cookies();
  jar.set(COOKIE, "", { maxAge: 0, path: "/studio" });
  jar.set("lyfx_session", "", { maxAge: 0, path: "/" });
  redirect("/");
}

export async function getAdminSession(): Promise<boolean> {
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  if (!value) return false;
  return verify(value);
}

// [FIX C-4] Internal guard — all sensitive actions must call this first
export async function requireAdmin() {
  const ok = await getAdminSession();
  if (!ok) throw new Error("Unauthorized.");
}

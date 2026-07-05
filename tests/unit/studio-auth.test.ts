import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";

/**
 * Studio admin session — HMAC-signed cookie with embedded expiry (v1.14.1).
 * Verifies the cookie cannot be forged and expires server-side.
 */

process.env.SESSION_SECRET = "unit-test-secret";

const cookieStore = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieStore.has(name) ? { name, value: cookieStore.get(name)! } : undefined,
    set: (name: string, value: string) => cookieStore.set(name, value),
    delete: (name: string) => cookieStore.delete(name),
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => { throw new Error("NEXT_REDIRECT"); }),
}));

import { getAdminSession, requireAdmin } from "@/app/studio/auth";

function adminCookie(expiresAtMs: number, secret = process.env.SESSION_SECRET!): string {
  const sig = createHmac("sha256", secret).update(`lyfx_admin.${expiresAtMs}`).digest("hex");
  return `${expiresAtMs}.${sig}`;
}

beforeEach(() => cookieStore.clear());

describe("getAdminSession", () => {
  it("returns false without a cookie", async () => {
    expect(await getAdminSession()).toBe(false);
  });

  it("accepts a valid, unexpired signed cookie", async () => {
    cookieStore.set("lyfx_admin", adminCookie(Date.now() + 60_000));
    expect(await getAdminSession()).toBe(true);
  });

  it("rejects the legacy static value '1'", async () => {
    cookieStore.set("lyfx_admin", "1");
    expect(await getAdminSession()).toBe(false);
  });

  it("rejects an expired cookie even with a valid signature", async () => {
    cookieStore.set("lyfx_admin", adminCookie(Date.now() - 1));
    expect(await getAdminSession()).toBe(false);
  });

  it("rejects a cookie signed with a different secret", async () => {
    cookieStore.set("lyfx_admin", adminCookie(Date.now() + 60_000, "attacker-secret"));
    expect(await getAdminSession()).toBe(false);
  });

  it("rejects a tampered expiry (signature no longer matches)", async () => {
    const [, sig] = adminCookie(Date.now() + 60_000).split(".");
    cookieStore.set("lyfx_admin", `${Date.now() + 999_999_999}.${sig}`);
    expect(await getAdminSession()).toBe(false);
  });
});

describe("requireAdmin", () => {
  it("throws Unauthorized without a valid session", async () => {
    await expect(requireAdmin()).rejects.toThrow("Unauthorized");
  });

  it("passes with a valid session", async () => {
    cookieStore.set("lyfx_admin", adminCookie(Date.now() + 60_000));
    await expect(requireAdmin()).resolves.toBeUndefined();
  });
});

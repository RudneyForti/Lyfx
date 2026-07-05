import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";

/**
 * Session layer unit tests — HMAC cookie validation + DB-backed revocation.
 * next/headers and the Prisma client are mocked: these tests exercise the
 * cryptographic and control-flow logic, not the framework or the database.
 */

process.env.SESSION_SECRET = "unit-test-secret";

const { cookieStore, dbMock } = vi.hoisted(() => ({
  cookieStore: new Map<string, string>(),
  dbMock: {
    session: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn().mockReturnValue({ catch: () => {} }),
      delete: vi.fn().mockReturnValue({ catch: () => {} }),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieStore.has(name) ? { name, value: cookieStore.get(name)! } : undefined,
    set: (name: string, value: string) => cookieStore.set(name, value),
    delete: (name: string) => cookieStore.delete(name),
  }),
  headers: async () => new Headers(),
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));

import { getSession, requireAuth } from "@/lib/session";

function sign(payload: string): string {
  return createHmac("sha256", process.env.SESSION_SECRET!).update(payload).digest("hex");
}

function validCookie(sessionId = "sess1", userId = "user1"): string {
  return `${sessionId}.${userId}.${sign(`${sessionId}.${userId}`)}`;
}

beforeEach(() => {
  cookieStore.clear();
  dbMock.session.findUnique.mockReset();
  dbMock.session.update.mockReturnValue({ catch: () => {} });
  dbMock.session.delete.mockReturnValue({ catch: () => {} });
});

describe("getSession", () => {
  it("returns null when no cookie is present", async () => {
    expect(await getSession()).toBeNull();
  });

  it("returns the session for a valid cookie backed by the DB", async () => {
    cookieStore.set("lyfx_session", validCookie());
    dbMock.session.findUnique.mockResolvedValue({
      userId: "user1",
      expiresAt: new Date(Date.now() + 60_000),
    });
    expect(await getSession()).toEqual({ sessionId: "sess1", userId: "user1" });
  });

  it("rejects a cookie with a forged signature", async () => {
    cookieStore.set("lyfx_session", "sess1.user1." + "0".repeat(64));
    expect(await getSession()).toBeNull();
    expect(dbMock.session.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a cookie whose userId was swapped after signing", async () => {
    const [sessionId, , sig] = validCookie("sess1", "user1").split(".");
    cookieStore.set("lyfx_session", `${sessionId}.attacker.${sig}`);
    expect(await getSession()).toBeNull();
  });

  it("rejects a valid signature when the session was revoked server-side", async () => {
    cookieStore.set("lyfx_session", validCookie());
    dbMock.session.findUnique.mockResolvedValue(null); // revoked / not found
    expect(await getSession()).toBeNull();
  });

  it("rejects and cleans up an expired session", async () => {
    cookieStore.set("lyfx_session", validCookie());
    dbMock.session.findUnique.mockResolvedValue({
      userId: "user1",
      expiresAt: new Date(Date.now() - 1),
    });
    expect(await getSession()).toBeNull();
    expect(dbMock.session.delete).toHaveBeenCalled();
  });

  it("rejects a DB session that belongs to a different user", async () => {
    cookieStore.set("lyfx_session", validCookie("sess1", "user1"));
    dbMock.session.findUnique.mockResolvedValue({
      userId: "someone-else",
      expiresAt: new Date(Date.now() + 60_000),
    });
    expect(await getSession()).toBeNull();
  });

  it("rejects malformed cookies", async () => {
    for (const bad of ["", "a.b", "a.b.c.d", "no-dots-at-all"]) {
      cookieStore.set("lyfx_session", bad);
      expect(await getSession()).toBeNull();
    }
  });
});

describe("requireAuth", () => {
  it("throws when unauthenticated", async () => {
    await expect(requireAuth()).rejects.toThrow("Unauthenticated");
  });

  it("returns the userId when authenticated", async () => {
    cookieStore.set("lyfx_session", validCookie());
    dbMock.session.findUnique.mockResolvedValue({
      userId: "user1",
      expiresAt: new Date(Date.now() + 60_000),
    });
    expect(await requireAuth()).toBe("user1");
  });
});

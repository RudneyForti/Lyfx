import { describe, it, expect } from "vitest";
import { generateSync } from "otplib";
import {
  generateTotpSecret,
  verifyTotpCode,
  generateBackupCodes,
  hashBackupCodes,
  verifyAndConsumeBackupCode,
} from "@/lib/totp";

describe("generateTotpSecret", () => {
  it("generates a non-empty base32 secret, unique per call", () => {
    const a = generateTotpSecret();
    const b = generateTotpSecret();
    expect(a).toMatch(/^[A-Z2-7]+=*$/);
    expect(a).not.toBe(b);
  });
});

describe("verifyTotpCode", () => {
  it("accepts a code generated for the same secret and time window", () => {
    const secret = generateTotpSecret();
    const code = generateSync({ secret });
    expect(verifyTotpCode(secret, code)).toBe(true);
  });

  it("rejects a code from a different secret", () => {
    const code = generateSync({ secret: generateTotpSecret() });
    expect(verifyTotpCode(generateTotpSecret(), code)).toBe(false);
  });

  it("rejects malformed input", () => {
    const secret = generateTotpSecret();
    expect(verifyTotpCode(secret, "")).toBe(false);
    expect(verifyTotpCode(secret, "abc")).toBe(false);
    expect(verifyTotpCode(secret, "000000")).toBe(false);
  });
});

describe("backup codes", () => {
  it("generates 8 codes in XXXX-XXXX-XXXX format, all unique", () => {
    const codes = generateBackupCodes();
    expect(codes).toHaveLength(8);
    for (const c of codes) expect(c).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(new Set(codes).size).toBe(8);
  });

  it("a backup code verifies against its hash and is consumed exactly once", async () => {
    const codes = generateBackupCodes();
    const hashes = await hashBackupCodes(codes);
    expect(hashes).toHaveLength(codes.length);
    expect(hashes[0]).not.toBe(codes[0]);

    const ok = await verifyAndConsumeBackupCode(codes[0], JSON.stringify(hashes));
    expect(ok.valid).toBe(true);
    expect(ok.remainingHashes).toHaveLength(7); // consumed — single use

    const reuse = await verifyAndConsumeBackupCode(codes[0], JSON.stringify(ok.remainingHashes));
    expect(reuse.valid).toBe(false); // same code cannot be used twice

    const wrong = await verifyAndConsumeBackupCode("0000-0000-0000", JSON.stringify(hashes));
    expect(wrong.valid).toBe(false);
    expect(wrong.remainingHashes).toHaveLength(8);
  });
});

import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { createHmac } from "crypto";
import { cookies } from "next/headers";

/* ── TOTP core ── */

export function generateTotpSecret(): string {
  return generateSecret(); // base32, ~160-bit
}

export function verifyTotpCode(secret: string, code: string): boolean {
  try {
    const result = verifySync({ token: code.replace(/\s/g, ""), secret });
    return result.valid;
  } catch {
    return false;
  }
}

export async function generateQrCodeUrl(email: string, secret: string): Promise<string> {
  const uri = generateURI({ label: email, issuer: "Lyfx", secret });
  return QRCode.toDataURL(uri, {
    width:  200,
    margin: 2,
    color:  { dark: "#000000", light: "#ffffff" }, // standard — máxima compatibilidade
  });
}

/* ── Backup codes ── */

export function generateBackupCodes(): string[] {
  return Array.from({ length: 8 }, () => {
    const bytes = crypto.randomBytes(6);
    const hex   = bytes.toString("hex").toUpperCase();
    return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
  });
}

export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map(c => bcrypt.hash(normalizeBackupCode(c), 10)));
}

export async function verifyAndConsumeBackupCode(
  code: string,
  hashesJson: string,
): Promise<{ valid: boolean; remainingHashes: string[] }> {
  const hashes: string[] = JSON.parse(hashesJson);
  const normalized = normalizeBackupCode(code);
  for (let i = 0; i < hashes.length; i++) {
    const match = await bcrypt.compare(normalized, hashes[i]);
    if (match) {
      const remainingHashes = hashes.filter((_, idx) => idx !== i);
      return { valid: true, remainingHashes };
    }
  }
  return { valid: false, remainingHashes: hashes };
}

function normalizeBackupCode(code: string): string {
  return code.replace(/-/g, "").toUpperCase();
}

/* ── Pending 2FA cookie (após senha validada, antes do TOTP) ── */

const PENDING_COOKIE = "lyfx_2fa";

export async function setPendingTwoFactor(userId: string): Promise<void> {
  const secret  = process.env.SESSION_SECRET ?? "fallback";
  const expiry  = (Date.now() + 5 * 60 * 1000).toString();
  const sig     = createHmac("sha256", secret).update(`${userId}|${expiry}`).digest("base64url");
  const value   = `${Buffer.from(userId).toString("base64url")}.${Buffer.from(expiry).toString("base64url")}.${sig}`;
  (await cookies()).set(PENDING_COOKIE, value, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   300, // 5 minutos
    path:     "/",
  });
}

export async function getPendingTwoFactor(): Promise<string | null> {
  const raw = (await cookies()).get(PENDING_COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  try {
    const userId = Buffer.from(parts[0], "base64url").toString();
    const expiry = parseInt(Buffer.from(parts[1], "base64url").toString(), 10);
    if (isNaN(expiry) || Date.now() > expiry) return null;
    const secret   = process.env.SESSION_SECRET ?? "fallback";
    const expected = createHmac("sha256", secret).update(`${userId}|${expiry}`).digest("base64url");
    const a = Buffer.from(parts[2]);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;
    return userId;
  } catch {
    return null;
  }
}

export async function clearPendingTwoFactor(): Promise<void> {
  (await cookies()).delete(PENDING_COOKIE);
}

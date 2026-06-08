"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import {
  generateTotpSecret,
  verifyTotpCode,
  generateQrCodeUrl,
  generateBackupCodes,
  hashBackupCodes,
  verifyAndConsumeBackupCode,
} from "@/lib/totp";
import { logEventBg } from "@/lib/audit";
import { getClientIp } from "@/lib/login-attempts";
import { headers } from "next/headers";

async function getIp() {
  try { return (await headers()).get("x-forwarded-for")?.split(",")[0].trim() ?? null; }
  catch { return null; }
}

/* ── Iniciar setup (gera secret, persiste provisoriamente, retorna QR) ── */
export async function initTwoFactorSetup(): Promise<{
  qrCodeUrl: string;
  secret:    string;
  error?:    never;
} | { error: string }> {
  const userId = await requireAuth();

  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, twoFactorEnabled: true } });
  if (!user) return { error: "Usuário não encontrado." };
  if (user.twoFactorEnabled) return { error: "2FA já está ativo." };

  const secret     = generateTotpSecret();
  const qrCodeUrl  = await generateQrCodeUrl(user.email ?? "lyfx", secret);

  // Persiste o secret provisoriamente (enabled permanece false até confirmação)
  await db.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });

  return { qrCodeUrl, secret };
}

/* ── Confirmar setup (verifica primeiro código, ativa 2FA, gera backups) ── */
export async function confirmTwoFactorSetup(code: string): Promise<{
  backupCodes: string[];
  error?:      never;
} | { error: string }> {
  const userId = await requireAuth();
  const ip = await getIp();

  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });
  if (!user?.twoFactorSecret) return { error: "Setup não iniciado. Recarregue a página." };
  if (user.twoFactorEnabled)  return { error: "2FA já está ativo." };

  const valid = verifyTotpCode(user.twoFactorSecret, code);
  if (!valid) return { error: "Código inválido. Verifique o horário do dispositivo e tente novamente." };

  const backupCodes  = generateBackupCodes();
  const backupHashes = await hashBackupCodes(backupCodes);

  await db.user.update({
    where: { id: userId },
    data:  {
      twoFactorEnabled:     true,
      twoFactorBackupCodes: JSON.stringify(backupHashes),
    },
  });

  logEventBg({ action: "auth.2fa.enabled", userId, ip: ip ?? undefined });

  return { backupCodes };
}

/* ── Desativar 2FA (exige código TOTP atual) ── */
export async function disableTwoFactor(code: string): Promise<{ error?: string }> {
  const userId = await requireAuth();
  const ip = await getIp();

  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });
  if (!user?.twoFactorEnabled) return { error: "2FA não está ativo." };

  const valid = verifyTotpCode(user.twoFactorSecret!, code);
  if (!valid) return { error: "Código inválido." };

  await db.user.update({
    where: { id: userId },
    data:  { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: null },
  });

  logEventBg({ action: "auth.2fa.disabled", userId, ip: ip ?? undefined });
  return {};
}

/* ── Regenerar códigos de backup (exige código TOTP) ── */
export async function regenerateBackupCodes(code: string): Promise<{
  backupCodes: string[];
  error?:      never;
} | { error: string }> {
  const userId = await requireAuth();

  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });
  if (!user?.twoFactorEnabled) return { error: "2FA não está ativo." };

  const valid = verifyTotpCode(user.twoFactorSecret!, code);
  if (!valid) return { error: "Código inválido." };

  const backupCodes  = generateBackupCodes();
  const backupHashes = await hashBackupCodes(backupCodes);

  await db.user.update({
    where: { id: userId },
    data:  { twoFactorBackupCodes: JSON.stringify(backupHashes) },
  });

  return { backupCodes };
}

/* ── Checar status 2FA do usuário autenticado ── */
export async function getTwoFactorStatus(): Promise<{
  enabled:      boolean;
  backupCount:  number;
}> {
  const userId = await requireAuth();
  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { twoFactorEnabled: true, twoFactorBackupCodes: true },
  });
  const backupCount = user?.twoFactorBackupCodes
    ? (JSON.parse(user.twoFactorBackupCodes) as string[]).length
    : 0;
  return { enabled: user?.twoFactorEnabled ?? false, backupCount };
}

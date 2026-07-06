/**
 * CS-35 — Security event Audit Log
 *
 * Records sensitive actions for traceability and anomaly detection.
 * The log NEVER blocks the main flow — use logEventBg() for fire-and-forget.
 *
 * Action catalog:
 *   auth.login.success      — successful login
 *   auth.login.failed       — invalid credentials
 *   auth.login.blocked      — IP blocked by rate limiting
 *   auth.login.captcha      — CAPTCHA required (threshold reached)
 *   auth.logout             — explicit logout
 *   auth.password.changed   — successful password change
 *   session.revoked         — specific session ended by the user
 *   session.revoked_all     — all other sessions ended
 *   auth.2fa.enabled        — 2FA enabled by the user (CS-37a)
 *   auth.2fa.disabled       — 2FA disabled by the user (CS-37a)
 *   auth.2fa.failed         — invalid TOTP code at login (CS-37a)
 *   auth.2fa.backup_used    — backup code used at login (CS-37a)
 */

import { db } from "@/lib/db";

export type AuditAction =
  | "auth.login.success"
  | "auth.login.failed"
  | "auth.login.blocked"
  | "auth.login.captcha"
  | "auth.logout"
  | "auth.password.changed"
  | "session.revoked"
  | "session.revoked_all"
  | "auth.2fa.enabled"
  | "auth.2fa.disabled"
  | "auth.2fa.failed"
  | "auth.2fa.backup_used";

export interface AuditEventOptions {
  action:     AuditAction;
  userId?:    string;
  sessionId?: string;
  ip?:        string;
  userAgent?: string;
  metadata?:  Record<string, unknown>;
}

/** Records an event in the audit log. */
export async function logEvent(opts: AuditEventOptions): Promise<void> {
  await db.auditLog.create({
    data: {
      action:    opts.action,
      userId:    opts.userId    ?? null,
      sessionId: opts.sessionId ?? null,
      ip:        opts.ip        ?? null,
      userAgent: opts.userAgent ?? null,
      // JSON.parse/stringify converts to a plain JSON object — compatible with Prisma's Json? field
      metadata:  opts.metadata ? JSON.parse(JSON.stringify(opts.metadata)) : undefined,
    },
  });
}

/**
 * Fire-and-forget — does not block the main flow.
 * Failures are swallowed (logging must never prevent an operation).
 */
export function logEventBg(opts: AuditEventOptions): void {
  logEvent(opts).catch(() => {});
}

// ── Labels and icons for the UI ───────────────────────────────────────────────

export interface AuditMeta {
  label:       string;
  description: (metadata?: Record<string, unknown> | null) => string;
  variant:     "success" | "danger" | "warning" | "info";
}

export const AUDIT_META: Record<AuditAction, AuditMeta> = {
  "auth.login.success": {
    label:       "Login",
    description: () => "Login realizado com sucesso.",
    variant:     "success",
  },
  "auth.login.failed": {
    label:       "Falha de login",
    description: (m) => m?.email ? `Tentativa falha para ${m.email}.` : "Credenciais inválidas.",
    variant:     "danger",
  },
  "auth.login.blocked": {
    label:       "IP bloqueado",
    description: (m) => `IP bloqueado por excesso de tentativas. Desbloqueio em ${m?.retryAfterMinutes ?? "?"} min.`,
    variant:     "danger",
  },
  "auth.login.captcha": {
    label:       "CAPTCHA exigido",
    description: () => "Número de tentativas atingiu o threshold — CAPTCHA solicitado.",
    variant:     "warning",
  },
  "auth.logout": {
    label:       "Logout",
    description: () => "Sessão encerrada pelo usuário.",
    variant:     "info",
  },
  "auth.password.changed": {
    label:       "Senha alterada",
    description: () => "Senha alterada com sucesso. Outras sessões foram encerradas.",
    variant:     "warning",
  },
  "session.revoked": {
    label:       "Sessão encerrada",
    description: () => "Uma sessão em outro dispositivo foi encerrada manualmente.",
    variant:     "info",
  },
  "session.revoked_all": {
    label:       "Todas as sessões encerradas",
    description: (m) => `${m?.count ?? "Outras"} sessão(ões) encerrada(s) em outros dispositivos.`,
    variant:     "warning",
  },
  "auth.2fa.enabled": {
    label:       "2FA ativado",
    description: () => "Autenticação em dois fatores ativada com sucesso.",
    variant:     "success",
  },
  "auth.2fa.disabled": {
    label:       "2FA desativado",
    description: () => "Autenticação em dois fatores foi desativada.",
    variant:     "warning",
  },
  "auth.2fa.failed": {
    label:       "Código 2FA inválido",
    description: () => "Tentativa de login com código TOTP inválido.",
    variant:     "danger",
  },
  "auth.2fa.backup_used": {
    label:       "Código de backup usado",
    description: (m) => `Código de backup utilizado no login. Restam ${m?.remaining ?? "?"} códigos.`,
    variant:     "warning",
  },
};

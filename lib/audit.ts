/**
 * CS-35 — Audit Log de eventos de segurança
 *
 * Registra ações sensíveis para rastreabilidade e detecção de anomalias.
 * O log NUNCA bloqueia o fluxo principal — use logEventBg() para fire-and-forget.
 *
 * Catálogo de ações:
 *   auth.login.success      — login bem-sucedido
 *   auth.login.failed       — credenciais inválidas
 *   auth.login.blocked      — IP bloqueado por rate limiting
 *   auth.login.captcha      — CAPTCHA exigido (threshold atingido)
 *   auth.logout             — logout explícito
 *   auth.password.changed   — troca de senha bem-sucedida
 *   session.revoked         — sessão específica encerrada pelo usuário
 *   session.revoked_all     — todas as outras sessões encerradas
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
  | "session.revoked_all";

export interface AuditEventOptions {
  action:     AuditAction;
  userId?:    string;
  sessionId?: string;
  ip?:        string;
  userAgent?: string;
  metadata?:  Record<string, unknown>;
}

/** Registra um evento no audit log. */
export async function logEvent(opts: AuditEventOptions): Promise<void> {
  await db.auditLog.create({
    data: {
      action:    opts.action,
      userId:    opts.userId    ?? null,
      sessionId: opts.sessionId ?? null,
      ip:        opts.ip        ?? null,
      userAgent: opts.userAgent ?? null,
      metadata:  opts.metadata  ?? undefined,
    },
  });
}

/**
 * Fire-and-forget — não bloqueia o fluxo principal.
 * Falhas são silenciadas (o log nunca deve impedir uma operação).
 */
export function logEventBg(opts: AuditEventOptions): void {
  logEvent(opts).catch(() => {});
}

// ── Rótulos e ícones para a UI ────────────────────────────────────────────────

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
};

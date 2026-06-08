"use server";

/**
 * CS-35 — Actions de Audit Log
 * Retorna os eventos de segurança do usuário autenticado.
 */

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { AUDIT_META } from "@/lib/audit";
import type { AuditAction } from "@/lib/audit";

export interface AuditLogEntry {
  id:          string;
  action:      AuditAction;
  label:       string;
  description: string;
  variant:     "success" | "danger" | "warning" | "info";
  ip:          string | null;
  createdAt:   Date;
}

/** Retorna os últimos 50 eventos de segurança do usuário autenticado. */
export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const userId = await requireAuth();

  const logs = await db.auditLog.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
    take:    50,
    select:  { id: true, action: true, ip: true, metadata: true, createdAt: true },
  });

  return logs.map((log) => {
    const action   = log.action as AuditAction;
    const meta     = AUDIT_META[action] ?? {
      label:       action,
      description: () => action,
      variant:     "info" as const,
    };
    const metadata = (log.metadata ?? undefined) as Record<string, unknown> | undefined;
    return {
      id:          log.id,
      action,
      label:       meta.label,
      description: meta.description(metadata),
      variant:     meta.variant,
      ip:          log.ip,
      createdAt:   log.createdAt,
    };
  });
}

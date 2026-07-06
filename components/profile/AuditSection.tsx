"use client";

/**
 * CS-35 — Security event history in the Profile
 * Shows the user's latest security events (login, logout, password changes, etc.).
 */

import { useState, useEffect } from "react";
import {
  IconLoader2,
  IconShieldCheck,
  IconShieldX,
  IconShieldExclamation,
  IconShieldLock,
  IconRefresh,
} from "@tabler/icons-react";
import { getAuditLogs } from "@/app/actions/audit";
import type { AuditLogEntry } from "@/app/actions/audit";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  // CS-41: timeZone:"UTC" keeps server/client consistent
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(date));
}

function relativeTime(date: Date): string {
  const now   = Date.now();
  const diff  = now - new Date(date).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins  < 1)   return "agora";
  if (mins  < 60)  return `${mins} min atrás`;
  if (hours < 24)  return `${hours}h atrás`;
  if (days  < 7)   return `${days}d atrás`;
  return formatDate(date);
}

// ── Icon per variant ──────────────────────────────────────────────────────────

const variantStyles = {
  success: { color: "var(--color-green)",  bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.2)" },
  danger:  { color: "var(--color-red)",    bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)" },
  warning: { color: "#F59E0B",             bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)" },
  info:    { color: "var(--color-cyan)",   bg: "rgba(34,211,238,0.08)",  border: "rgba(34,211,238,0.2)" },
};

function EventIcon({ variant }: { variant: AuditLogEntry["variant"] }) {
  const color = variantStyles[variant].color;
  const props = { size: 14, color, style: { flexShrink: 0 } };

  if (variant === "success") return <IconShieldCheck {...props} />;
  if (variant === "danger")  return <IconShieldX     {...props} />;
  if (variant === "warning") return <IconShieldExclamation {...props} />;
  return <IconShieldLock {...props} />;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function AuditSection() {
  const [logs, setLogs]       = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // loading starts true — no sync setState needed inside the mount effect
  async function load() {
    try {
      const data = await getAuditLogs();
      setLogs(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">
          Histórico de segurança
        </span>
        {!loading && (
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-1 text-[10px] text-[var(--color-f4)] hover:text-[var(--color-cyan)] transition-colors cursor-pointer"
          >
            <IconRefresh size={11} />
            Atualizar
          </button>
        )}
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center gap-2 text-[12px] text-[var(--color-f4)]">
          <IconLoader2 size={14} className="animate-spin" />
          Carregando histórico...
        </div>
      ) : logs.length === 0 ? (
        <p className="text-[12px] text-[var(--color-f4)]">
          Nenhum evento de segurança registrado ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {logs.map((log) => {
            const style = variantStyles[log.variant];
            return (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-[12px] border px-4 py-3"
                style={{
                  backgroundColor: style.bg,
                  borderColor:     style.border,
                }}
              >
                {/* Ícone */}
                <div className="mt-0.5">
                  <EventIcon variant={log.variant} />
                </div>

                {/* Texto */}
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className="text-[12px] font-semibold"
                      style={{ color: style.color }}
                    >
                      {log.label}
                    </span>
                    <span
                      className="text-[10px] flex-shrink-0"
                      style={{ color: "var(--color-f4)" }}
                      title={formatDate(log.createdAt)}
                    >
                      {relativeTime(log.createdAt)}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--color-f3)]">
                    {log.description}
                  </span>
                  {log.ip && (
                    <span className="text-[10px] text-[var(--color-f4)]">
                      IP: {log.ip}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

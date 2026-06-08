"use client";

/**
 * CS-34 — Seção de sessões ativas no Perfil
 * Exibe todas as sessões do usuário com opção de revogar individualmente ou todas.
 */

import { useState, useTransition, useEffect } from "react";
import { IconDeviceDesktop, IconDeviceMobile, IconLoader2, IconX, IconCheck, IconShieldCheck } from "@tabler/icons-react";
import { getSessions, revokeSession, revokeAllOtherSessions } from "@/app/actions/sessions";
import type { SessionInfo } from "@/app/actions/sessions";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(date));
}

function DeviceIcon({ device }: { device: string }) {
  const isMobile = /iphone|android|ipad/i.test(device);
  return isMobile
    ? <IconDeviceMobile size={16} className="text-[var(--color-cyan)] flex-shrink-0" />
    : <IconDeviceDesktop size={16} className="text-[var(--color-cyan)] flex-shrink-0" />;
}

export function SessionsSection() {
  const [sessions, setSessions]     = useState<SessionInfo[]>([]);
  const [loading, setLoading]       = useState(true);
  const [msg, setMsg]               = useState<{ ok?: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function flash(ok: boolean, text: string) {
    setMsg({ ok, text });
    setTimeout(() => setMsg(null), 3500);
  }

  function handleRevoke(sessionId: string) {
    startTransition(async () => {
      await revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      flash(true, "Sessão encerrada.");
    });
  }

  function handleRevokeAll() {
    startTransition(async () => {
      await revokeAllOtherSessions();
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      flash(true, "Todas as outras sessões foram encerradas.");
    });
  }

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">
        Sessões ativas
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[12px] text-[var(--color-f4)]">
          <IconLoader2 size={14} className="animate-spin" />
          Carregando sessões...
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-[12px] text-[var(--color-f4)]">Nenhuma sessão ativa encontrada.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-start justify-between gap-3 rounded-[12px] border border-[var(--color-border2)] bg-[var(--color-bg3)] px-4 py-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <DeviceIcon device={session.device} />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-medium text-[var(--color-f1)] truncate">
                      {session.device}
                    </span>
                    {session.isCurrent && (
                      <span className="flex items-center gap-1 text-[9px] font-bold tracking-[1.5px] uppercase text-[var(--color-cyan)] bg-[rgba(34,211,238,0.08)] border border-[rgba(34,211,238,0.2)] rounded-full px-2 py-0.5">
                        <IconShieldCheck size={9} />
                        Esta sessão
                      </span>
                    )}
                  </div>
                  {session.ip && (
                    <span className="text-[11px] text-[var(--color-f4)]">
                      IP: {session.ip}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--color-f4)]">
                    Último acesso: {formatDate(session.lastSeenAt)}
                  </span>
                  <span className="text-[10px] text-[var(--color-f4)]">
                    Criada em: {formatDate(session.createdAt)}
                  </span>
                </div>
              </div>

              {!session.isCurrent && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRevoke(session.id)}
                  className="flex items-center gap-1.5 text-[11px] text-[var(--color-red)] hover:opacity-70 transition-opacity cursor-pointer disabled:opacity-40 flex-shrink-0 mt-0.5"
                >
                  <IconX size={12} />
                  Encerrar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Feedback */}
      {msg && (
        <span className={`flex items-center gap-1 text-[11px] ${msg.ok ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}`}>
          {msg.ok ? <IconCheck size={11} /> : <IconX size={11} />}
          {msg.text}
        </span>
      )}

      {/* Revogar todas */}
      {!loading && otherSessions.length > 0 && (
        <button
          type="button"
          disabled={isPending}
          onClick={handleRevokeAll}
          className="self-start flex items-center gap-2 px-4 py-2 rounded-full text-[12px] text-[var(--color-red)] border border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.06)] transition-all cursor-pointer disabled:opacity-50"
        >
          {isPending
            ? <IconLoader2 size={13} className="animate-spin" />
            : <IconX size={13} />
          }
          Encerrar todas as outras sessões ({otherSessions.length})
        </button>
      )}
    </div>
  );
}

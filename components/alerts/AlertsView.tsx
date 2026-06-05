"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Alert } from "@/app/actions/alerts";
import type { NotificationItem } from "@/app/actions/notifications";
import { markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } from "@/app/actions/notifications";
import {
  IconAlertTriangle,
  IconAlertCircle,
  IconInfoCircle,
  IconArrowRight,
  IconBellOff,
  IconBell,
  IconWallet,
  IconTarget,
  IconChartLine,
  IconCalendarDue,
  IconCreditCard,
  IconCircleCheck,
  IconChecks,
  IconX,
  IconTrash,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

// ── helpers ──────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  budget: {
    label: "Orçamento",
    Icon: IconWallet,
    color: "var(--color-amber)",
    dimColor: "rgba(251,191,36,0.08)",
  },
  goal: {
    label: "Metas",
    Icon: IconTarget,
    color: "var(--color-cyan)",
    dimColor: "var(--color-cyan-faint)",
  },
  projection: {
    label: "Projeções",
    Icon: IconChartLine,
    color: "#A78BFA",
    dimColor: "rgba(167,139,250,0.08)",
  },
  seasonal: {
    label: "Sazonais",
    Icon: IconCalendarDue,
    color: "var(--color-amber)",
    dimColor: "rgba(251,191,36,0.08)",
  },
  liability: {
    label: "Passivos",
    Icon: IconCreditCard,
    color: "var(--color-red)",
    dimColor: "rgba(248,113,113,0.08)",
  },
} as const;

const SEVERITY_CONFIG = {
  danger: {
    Icon: IconAlertCircle,
    color: "var(--color-red)",
    bg: "var(--color-red-dim)",
    borderColor: "rgba(248,113,113,0.25)",
    label: "Urgente",
  },
  warning: {
    Icon: IconAlertTriangle,
    color: "var(--color-amber)",
    bg: "rgba(251,191,36,0.06)",
    borderColor: "rgba(251,191,36,0.2)",
    label: "Atenção",
  },
  info: {
    Icon: IconInfoCircle,
    color: "var(--color-cyan)",
    bg: "var(--color-cyan-faint)",
    borderColor: "var(--color-cyan-border)",
    label: "Info",
  },
} as const;

// ── Notification section ──────────────────────────────────────────────

const NOTIF_TYPE_CONFIG = {
  danger:  { Icon: IconAlertCircle,  color: "var(--color-red)",   bg: "var(--color-red-dim)",        border: "rgba(248,113,113,0.25)", label: "Urgente"  },
  warning: { Icon: IconAlertTriangle, color: "var(--color-amber)", bg: "rgba(251,191,36,0.06)",        border: "rgba(251,191,36,0.2)",   label: "Aviso"    },
  info:    { Icon: IconInfoCircle,   color: "var(--color-cyan)",   bg: "var(--color-cyan-faint)",      border: "var(--color-cyan-border)", label: "Info"    },
  success: { Icon: IconCircleCheck,  color: "#A3E635",             bg: "rgba(163,230,53,0.06)",        border: "rgba(163,230,53,0.2)",   label: "Sucesso"  },
} as const;

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

function NotificationsSection({ initial }: { initial: NotificationItem[] }) {
  const [items, setItems] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const unread = items.filter((n) => !n.readAt);

  function handleMarkOne(id: string) {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date() } : n));
    startTransition(() => markAsRead(id));
  }

  function handleMarkAll() {
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })));
    startTransition(() => markAllAsRead());
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((n) => n.id !== id));
    startTransition(() => deleteNotification(id));
  }

  function handleClearAll() {
    setItems([]);
    startTransition(() => deleteAllNotifications());
  }

  if (items.length === 0) return null;

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <IconBell size={14} className="text-[var(--color-cyan)]" />
          <span className="text-[10px] font-bold tracking-[1.8px] uppercase text-[var(--color-cyan)]">
            Notificações ({items.length})
          </span>
          {unread.length > 0 && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--color-red-dim)] text-[var(--color-red)]">
              {unread.length} não {unread.length === 1 ? "lida" : "lidas"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unread.length > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={isPending}
              className="flex items-center gap-1 text-[11px] text-[var(--color-f4)] hover:text-[var(--color-cyan)] transition-colors cursor-pointer disabled:opacity-50"
            >
              <IconChecks size={13} />
              Marcar todas como lidas
            </button>
          )}
          <button
            type="button"
            onClick={handleClearAll}
            disabled={isPending}
            className="flex items-center gap-1 text-[11px] text-[var(--color-f4)] hover:text-[var(--color-red)] transition-colors cursor-pointer disabled:opacity-50"
          >
            <IconTrash size={12} />
            Limpar tudo
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {items.map((notif) => {
          const cfg = NOTIF_TYPE_CONFIG[notif.type];
          const isRead = !!notif.readAt;
          return (
            <div
              key={notif.id}
              className="flex items-start gap-4 p-4 rounded-[12px] border transition-all"
              style={{
                background: isRead ? "rgba(255,255,255,0.02)" : cfg.bg,
                borderColor: isRead ? "var(--color-border)" : cfg.border,
                opacity: isRead ? 0.6 : 1,
              }}
            >
              {/* Type icon */}
              <div className="shrink-0 mt-0.5" style={{ color: isRead ? "var(--color-f4)" : cfg.color }}>
                <cfg.Icon size={18} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={cn("text-[13px] font-semibold", isRead ? "text-[var(--color-f3)]" : "text-[var(--color-f1)]")}>
                    {notif.title}
                  </span>
                  <span
                    className="text-[9px] font-bold tracking-[1px] uppercase px-1.5 py-0.5 rounded-[4px] shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                  {isRead && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-[rgba(255,255,255,0.05)] text-[var(--color-f4)]">
                      Lida
                    </span>
                  )}
                </div>
                {/* Texto completo */}
                <p className="text-[13px] text-[var(--color-f3)] leading-relaxed">
                  {notif.body}
                </p>
                <div className="mt-1.5 text-[10px] text-[var(--color-f4)]">
                  {timeAgo(notif.createdAt)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 mt-0.5">
                {notif.link && (
                  <Link
                    href={notif.link}
                    onClick={() => !isRead && handleMarkOne(notif.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-[7px] text-[11px] font-medium border transition-all no-underline"
                    style={{ borderColor: cfg.border, color: cfg.color }}
                  >
                    Ver
                    <IconArrowRight size={11} />
                  </Link>
                )}
                {!isRead ? (
                  <button
                    type="button"
                    onClick={() => handleMarkOne(notif.id)}
                    title="Marcar como lida"
                    className="w-6 h-6 flex items-center justify-center rounded-[6px] text-[var(--color-f4)] hover:text-[var(--color-f2)] hover:bg-white/[0.06] transition-all cursor-pointer"
                  >
                    <IconX size={13} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDelete(notif.id)}
                    title="Apagar notificação"
                    disabled={isPending}
                    className="w-6 h-6 flex items-center justify-center rounded-[6px] text-[var(--color-f4)] hover:text-[var(--color-red)] hover:bg-[rgba(248,113,113,0.08)] transition-all cursor-pointer disabled:opacity-40"
                  >
                    <IconTrash size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Alert card ────────────────────────────────────────────────────────

function AlertCard({ alert }: { alert: Alert }) {
  const sev = SEVERITY_CONFIG[alert.severity];
  const typ = TYPE_CONFIG[alert.type];
  const TypeIcon = typ.Icon;

  return (
    <div
      className="flex items-start gap-4 p-4 rounded-[12px] border transition-all"
      style={{ background: sev.bg, borderColor: sev.borderColor }}
    >
      {/* Severity icon */}
      <div className="shrink-0 mt-0.5" style={{ color: sev.color }}>
        <sev.Icon size={18} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[13px] font-semibold text-[var(--color-f1)]">{alert.title}</span>
          <span
            className="text-[9px] font-bold tracking-[1px] uppercase px-1.5 py-0.5 rounded-[4px] shrink-0"
            style={{ background: typ.dimColor, color: typ.color }}
          >
            <span className="flex items-center gap-1">
              <TypeIcon size={9} />
              {typ.label}
            </span>
          </span>
        </div>
        <p className="text-[12px] text-[var(--color-f3)] leading-relaxed">{alert.description}</p>
      </div>

      {/* Link */}
      <Link
        href={alert.link}
        className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-[7px] text-[11px] font-medium border transition-all no-underline mt-0.5"
        style={{
          borderColor: sev.borderColor,
          color: sev.color,
        }}
      >
        Ver
        <IconArrowRight size={11} />
      </Link>
    </div>
  );
}

// ── Group section ─────────────────────────────────────────────────────

function AlertGroup({
  severity,
  alerts,
}: {
  severity: "danger" | "warning" | "info";
  alerts: Alert[];
}) {
  if (alerts.length === 0) return null;
  const { label, color, Icon } = SEVERITY_CONFIG[severity];

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} style={{ color }} />
        <span className="text-[10px] font-bold tracking-[1.8px] uppercase" style={{ color }}>
          {label} ({alerts.length})
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {alerts.map((a) => (
          <AlertCard key={a.id} alert={a} />
        ))}
      </div>
    </section>
  );
}

// ── Main view ─────────────────────────────────────────────────────────

interface Props {
  alerts: Alert[];
  notifications?: NotificationItem[];
}

export function AlertsView({ alerts, notifications = [] }: Props) {
  const danger = alerts.filter((a) => a.severity === "danger");
  const warning = alerts.filter((a) => a.severity === "warning");
  const info = alerts.filter((a) => a.severity === "info");

  const byType = {
    budget: alerts.filter((a) => a.type === "budget").length,
    goal: alerts.filter((a) => a.type === "goal").length,
    projection: alerts.filter((a) => a.type === "projection").length,
    seasonal: alerts.filter((a) => a.type === "seasonal").length,
    liability: alerts.filter((a) => a.type === "liability").length,
  };

  return (
    <div className="p-8 max-w-[860px]">
      {/* Header */}
      <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2.5 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
        Monitoramento
      </div>
      <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] mb-2 leading-tight">
        Alertas e <span className="text-[var(--color-cyan)]">Notificações</span>
      </h1>
      <p className="text-[var(--color-f3)] text-sm mb-8">
        Alertas financeiros gerados automaticamente e notificações do sistema.
      </p>

      {/* Notificações — sempre visíveis quando existem */}
      {notifications.length > 0 && (
        <NotificationsSection initial={notifications} />
      )}

      {alerts.length === 0 ? (
        /* Empty state — só mostra se também não tem notificações */
        notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-green-dim)] flex items-center justify-center mb-4">
              <IconBellOff size={28} className="text-[var(--color-green)]" />
            </div>
            <div className="text-[16px] font-semibold text-[var(--color-f1)] mb-1">Tudo em ordem!</div>
            <div className="text-[13px] text-[var(--color-f4)] max-w-[320px]">
              Nenhum alerta ativo no momento. Continue assim e o Lyfx vai te avisar quando algo precisar de atenção.
            </div>
          </div>
        ) : null
      ) : (
        <>
          {/* Summary chips */}
          <div className="flex gap-3 flex-wrap mb-8">
            {(Object.entries(byType) as [keyof typeof TYPE_CONFIG, number][])
              .filter(([, count]) => count > 0)
              .map(([type, count]) => {
                const { label, color, dimColor, Icon } = TYPE_CONFIG[type];
                return (
                  <div
                    key={type}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-[11px] font-semibold"
                    style={{ background: dimColor, color }}
                  >
                    <Icon size={12} />
                    {label}: {count}
                  </div>
                );
              })}
          </div>

          {/* Grouped alerts */}
          <AlertGroup severity="danger" alerts={danger} />
          <AlertGroup severity="warning" alerts={warning} />
          <AlertGroup severity="info" alerts={info} />
        </>
      )}
    </div>
  );
}

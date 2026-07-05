"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconBell,
  IconBellOff,
  IconAlertCircle,
  IconAlertTriangle,
  IconInfoCircle,
  IconCircleCheck,
  IconLoader2,
  IconChecks,
  IconX,
  IconArrowRight,
  IconChartLine,
  IconWallet,
  IconTarget,
  IconCalendarDue,
  IconCreditCard,
} from "@tabler/icons-react";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from "@/app/actions/notifications";
import { getAlerts } from "@/app/actions/alerts";
import type { NotificationItem } from "@/app/actions/notifications";
import type { Alert } from "@/app/actions/alerts";

/* ── helpers ──────────────────────────────────────────────────────── */

const NOTIF_ICON: Record<NotificationItem["type"], React.ReactNode> = {
  danger:  <IconAlertCircle  size={14} style={{ color: "var(--color-red)",   flexShrink: 0 }} />,
  warning: <IconAlertTriangle size={14} style={{ color: "var(--color-amber)", flexShrink: 0 }} />,
  info:    <IconInfoCircle   size={14} style={{ color: "var(--color-cyan)",   flexShrink: 0 }} />,
  success: <IconCircleCheck  size={14} style={{ color: "#A3E635",             flexShrink: 0 }} />,
};

const ALERT_SEV_COLOR: Record<Alert["severity"], string> = {
  danger:  "var(--color-red)",
  warning: "var(--color-amber)",
  info:    "var(--color-cyan)",
};

const ALERT_TYPE_ICON: Record<Alert["type"], React.ReactNode> = {
  budget:     <IconWallet     size={12} />,
  goal:       <IconTarget     size={12} />,
  projection: <IconChartLine  size={12} />,
  seasonal:   <IconCalendarDue size={12} />,
  liability:  <IconCreditCard size={12} />,
};

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

/* ── Component ────────────────────────────────────────────────────── */

interface Props {
  unreadCount: number;
}

export function NotificationPanel({ unreadCount }: Props) {
  const [open, setOpen]               = useState(false);
  const [notifs, setNotifs]           = useState<NotificationItem[]>([]);
  const [alerts, setAlerts]           = useState<Alert[]>([]);
  const [loading, setLoading]         = useState(false);
  const [localUnread, setLocalUnread] = useState(unreadCount);
  const [, startTransition]           = useTransition();
  const ref    = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Sync badge on navigation — setState during render with prev tracking
  const [prevUnread, setPrevUnread] = useState(unreadCount);
  if (unreadCount !== prevUnread) {
    setPrevUnread(unreadCount);
    setLocalUnread(unreadCount);
  }

  async function handleOpen() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      setLoading(true);
      try {
        const [nData, aData] = await Promise.all([getNotifications(), getAlerts()]);
        setNotifs(nData);
        setAlerts(aData);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleNotifClick(item: NotificationItem) {
    if (!item.readAt) {
      await markAsRead(item.id);
      setNotifs((prev) => prev.map((n) => n.id === item.id ? { ...n, readAt: new Date() } : n));
      setLocalUnread((c) => Math.max(0, c - 1));
    }
    if (item.link) { setOpen(false); router.push(item.link); }
  }

  function handleDelete(id: string) {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    setLocalUnread((c) => {
      const wasUnread = notifs.find((n) => n.id === id && !n.readAt);
      return wasUnread ? Math.max(0, c - 1) : c;
    });
    startTransition(() => deleteNotification(id));
  }

  async function handleMarkAll() {
    await markAllAsRead();
    setNotifs((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })));
    setLocalUnread(0);
  }

  const displayCount = localUnread > 99 ? "99+" : localUnread > 0 ? String(localUnread) : null;
  const unreadNotifs = notifs.filter((n) => !n.readAt);
  const dangerAlerts  = alerts.filter((a) => a.severity === "danger");
  const otherAlerts   = alerts.filter((a) => a.severity !== "danger");

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={handleOpen}
        className="relative w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-150 cursor-pointer"
        style={{
          background:   open ? "rgba(34,211,238,0.08)" : "var(--color-bg2)",
          borderColor:  open ? "var(--color-cyan-border)" : "var(--color-border2)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
        }}
        aria-label="Alertas e Notificações"
      >
        <IconBell size={15} style={{ color: open ? "var(--color-cyan)" : "var(--color-f3)" }} />
        {displayCount && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center"
            style={{ background: "var(--color-red)", color: "#fff", fontSize: 9, fontWeight: 700, lineHeight: 1 }}
          >
            {displayCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute top-[calc(100%+8px)] right-0 w-[340px] rounded-[16px] border shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden"
          style={{ background: "var(--color-bg3)", borderColor: "var(--color-border2)", zIndex: 60 }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <IconLoader2 size={20} className="animate-spin text-[var(--color-f4)]" />
            </div>
          ) : alerts.length === 0 && notifs.length === 0 ? (
            /* ── Empty state único ── */
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-[var(--color-f4)]">
              <IconBellOff size={26} />
              <span className="text-[12px]">Nada por aqui</span>
            </div>
          ) : (
            <div className="max-h-[480px] overflow-y-auto">

              {/* ── Seção: Alertas financeiros ──────────────────────── */}
              {alerts.length > 0 && (
                <div>
                  <div
                    className="flex items-center justify-between px-4 py-2.5 border-b"
                    style={{ borderColor: "var(--color-border)", background: "rgba(248,113,113,0.04)" }}
                  >
                    <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-[var(--color-red)]">
                      Alertas financeiros · {alerts.length}
                    </span>
                    <Link
                      href="/alerts"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-1 text-[10px] text-[var(--color-f4)] hover:text-[var(--color-cyan)] transition-colors no-underline"
                    >
                      Ver todos <IconArrowRight size={10} />
                    </Link>
                  </div>

                  {/* Danger alerts — compact list */}
                  {dangerAlerts.slice(0, 3).map((a) => (
                    <Link
                      key={a.id}
                      href={a.link}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-2.5 border-b no-underline transition-colors duration-100"
                      style={{ borderColor: "var(--color-border)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span className="mt-0.5 flex-shrink-0" style={{ color: ALERT_SEV_COLOR[a.severity] }}>
                        <IconAlertCircle size={13} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[12px] font-medium truncate text-[var(--color-f1)]">{a.title}</span>
                          <span className="flex items-center gap-0.5 text-[9px] font-semibold" style={{ color: ALERT_SEV_COLOR[a.severity] }}>
                            {ALERT_TYPE_ICON[a.type]}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--color-f4)] mt-0.5 line-clamp-1">{a.description}</p>
                      </div>
                    </Link>
                  ))}

                  {/* Other alerts — just counts grouped by severity */}
                  {otherAlerts.length > 0 && (
                    <div className="flex items-center gap-3 px-4 py-2 border-b" style={{ borderColor: "var(--color-border)" }}>
                      {(["warning", "info"] as const).map((sev) => {
                        const count = otherAlerts.filter((a) => a.severity === sev).length;
                        if (!count) return null;
                        return (
                          <span key={sev} className="flex items-center gap-1 text-[10px]" style={{ color: ALERT_SEV_COLOR[sev] }}>
                            {sev === "warning" ? <IconAlertTriangle size={11} /> : <IconInfoCircle size={11} />}
                            {count} {sev === "warning" ? "avisos" : "informações"}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {dangerAlerts.length > 3 && (
                    <Link
                      href="/alerts"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center gap-1 py-2 text-[11px] text-[var(--color-f4)] hover:text-[var(--color-f2)] border-b no-underline transition-colors"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      +{dangerAlerts.length - 3} alertas urgentes <IconArrowRight size={10} />
                    </Link>
                  )}
                </div>
              )}

              {/* ── Seção: Notificações ─────────────────────────────── */}
              {notifs.length > 0 && (
                <div>
                  {/* Header compacto — mesmo estilo dos alertas financeiros */}
                  <div
                    className="flex items-center justify-between px-4 py-2.5 border-b"
                    style={{ borderColor: "var(--color-border)", background: "rgba(34,211,238,0.04)" }}
                  >
                    <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-[var(--color-cyan)]">
                      Notificações · {notifs.length}
                    </span>
                    <Link
                      href="/alerts"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-1 text-[10px] text-[var(--color-f4)] hover:text-[var(--color-cyan)] transition-colors no-underline"
                    >
                      Ver todas <IconArrowRight size={10} />
                    </Link>
                  </div>

                  {notifs.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0"
                      style={{
                        borderColor: "var(--color-border)",
                        background: item.readAt ? "transparent" : "rgba(34,211,238,0.03)",
                      }}
                    >
                      {/* Type icon */}
                      <span className="mt-0.5 flex-shrink-0">{NOTIF_ICON[item.type]}</span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className="text-[12px] font-medium leading-snug"
                            style={{ color: item.readAt ? "var(--color-f3)" : "var(--color-f1)" }}
                          >
                            {item.title}
                          </span>
                          <span className="text-[10px] text-[var(--color-f4)] flex-shrink-0 mt-px">
                            {timeAgo(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--color-f4)] mt-0.5 leading-[1.5] line-clamp-2">
                          {item.body}
                        </p>
                      </div>

                      {/* Unread dot / delete */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-1 mt-0.5">
                        {!item.readAt ? (
                          <button
                            type="button"
                            title="Marcar como lida"
                            onClick={() => handleNotifClick(item)}
                            className="w-5 h-5 flex items-center justify-center rounded-[4px] cursor-pointer group"
                          >
                            <span className="w-1.5 h-1.5 rounded-full group-hover:hidden" style={{ background: "var(--color-cyan)" }} />
                            <IconX size={11} className="hidden group-hover:block text-[var(--color-f4)]" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="Apagar notificação"
                            onClick={() => handleDelete(item.id)}
                            className="w-5 h-5 flex items-center justify-center rounded-[4px] text-[var(--color-f4)] hover:text-[var(--color-red)] hover:bg-[rgba(248,113,113,0.08)] transition-all cursor-pointer"
                          >
                            <IconX size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

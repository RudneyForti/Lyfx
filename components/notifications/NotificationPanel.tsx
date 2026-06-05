"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IconBell,
  IconBellOff,
  IconAlertCircle,
  IconAlertTriangle,
  IconInfoCircle,
  IconCircleCheck,
  IconLoader2,
  IconChecks,
} from "@tabler/icons-react";
import { getNotifications, markAsRead, markAllAsRead } from "@/app/actions/notifications";
import type { NotificationItem } from "@/app/actions/notifications";

interface Props {
  unreadCount: number;
}

const TYPE_ICON: Record<NotificationItem["type"], React.ReactNode> = {
  danger:  <IconAlertCircle  size={15} style={{ color: "var(--color-red)",   flexShrink: 0 }} />,
  warning: <IconAlertTriangle size={15} style={{ color: "var(--color-amber)", flexShrink: 0 }} />,
  info:    <IconInfoCircle   size={15} style={{ color: "var(--color-cyan)",   flexShrink: 0 }} />,
  success: <IconCircleCheck  size={15} style={{ color: "#A3E635",             flexShrink: 0 }} />,
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

export function NotificationPanel({ unreadCount }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [localUnread, setLocalUnread] = useState(unreadCount);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Sync badge quando prop muda (ex: navegação SSR)
  useEffect(() => {
    setLocalUnread(unreadCount);
  }, [unreadCount]);

  async function handleOpen() {
    setOpen((o) => !o);
    if (!open) {
      setLoading(true);
      try {
        const data = await getNotifications();
        setItems(data);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleClick(item: NotificationItem) {
    if (!item.readAt) {
      await markAsRead(item.id);
      setItems((prev) =>
        prev.map((n) => n.id === item.id ? { ...n, readAt: new Date() } : n)
      );
      setLocalUnread((c) => Math.max(0, c - 1));
    }
    if (item.link) {
      setOpen(false);
      router.push(item.link);
    }
  }

  async function handleMarkAll() {
    await markAllAsRead();
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })));
    setLocalUnread(0);
  }

  const displayCount = localUnread > 99 ? "99+" : localUnread > 0 ? String(localUnread) : null;

  return (
    <div ref={ref} className="relative">
      {/* Sino */}
      <button
        type="button"
        onClick={handleOpen}
        className="relative w-8 h-8 flex items-center justify-center rounded-full border transition-all duration-150 cursor-pointer"
        style={{
          background: open ? "rgba(34,211,238,0.08)" : "var(--color-bg2)",
          borderColor: open ? "var(--color-cyan-border)" : "var(--color-border2)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
        }}
        aria-label="Notificações"
      >
        <IconBell size={15} style={{ color: open ? "var(--color-cyan)" : "var(--color-f3)" }} />
        {displayCount && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center"
            style={{
              background: "var(--color-red)",
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {displayCount}
          </span>
        )}
      </button>

      {/* Painel dropdown */}
      {open && (
        <div
          className="absolute top-[calc(100%+8px)] right-0 w-[320px] rounded-[16px] border shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden"
          style={{
            background: "var(--color-bg3)",
            borderColor: "var(--color-border2)",
            zIndex: 60,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <span className="text-[13px] font-semibold text-[var(--color-f1)]">
              Notificações
              {localUnread > 0 && (
                <span className="ml-2 text-[10px] font-normal text-[var(--color-f4)]">
                  {localUnread} não {localUnread === 1 ? "lida" : "lidas"}
                </span>
              )}
            </span>
            {localUnread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-[11px] text-[var(--color-f4)] hover:text-[var(--color-cyan)] transition-colors cursor-pointer"
              >
                <IconChecks size={13} />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-[380px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <IconLoader2 size={20} className="animate-spin text-[var(--color-f4)]" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-[var(--color-f4)]">
                <IconBellOff size={24} />
                <span className="text-[12px]">Nenhuma notificação</span>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleClick(item)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-100 cursor-pointer border-b last:border-b-0"
                  style={{
                    background: item.readAt ? "transparent" : "rgba(34,211,238,0.03)",
                    borderColor: "var(--color-border)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = item.readAt ? "transparent" : "rgba(34,211,238,0.03)")}
                >
                  <span className="mt-0.5">{TYPE_ICON[item.type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-[12px] font-medium truncate"
                        style={{ color: item.readAt ? "var(--color-f3)" : "var(--color-f1)" }}
                      >
                        {item.title}
                      </span>
                      <span className="text-[10px] text-[var(--color-f4)] flex-shrink-0">
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--color-f4)] mt-0.5 leading-[1.5] line-clamp-2">
                      {item.body}
                    </p>
                  </div>
                  {!item.readAt && (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                      style={{ background: "var(--color-cyan)" }}
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

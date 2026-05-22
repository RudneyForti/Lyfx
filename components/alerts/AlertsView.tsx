"use client";

import Link from "next/link";
import type { Alert } from "@/app/actions/alerts";
import {
  IconAlertTriangle,
  IconAlertCircle,
  IconInfoCircle,
  IconArrowRight,
  IconBellOff,
  IconWallet,
  IconTarget,
  IconChartLine,
  IconCalendarDue,
  IconCreditCard,
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
}

export function AlertsView({ alerts }: Props) {
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
        Aler<span className="text-[var(--color-cyan)]">tas</span>
      </h1>
      <p className="text-[var(--color-f3)] text-sm mb-8">
        Tudo que merece a sua atenção agora: orçamentos, metas, projeções, passivos críticos e despesas sazonais.
      </p>

      {alerts.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-green-dim)] flex items-center justify-center mb-4">
            <IconBellOff size={28} className="text-[var(--color-green)]" />
          </div>
          <div className="text-[16px] font-semibold text-[var(--color-f1)] mb-1">Tudo em ordem!</div>
          <div className="text-[13px] text-[var(--color-f4)] max-w-[320px]">
            Nenhum alerta ativo no momento. Continue assim e o Lyfx vai te avisar quando algo precisar de atenção.
          </div>
        </div>
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold"
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

"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteKmPeriod } from "@/app/actions/km-reimbursement";
import type { KmPeriodSummary } from "@/app/actions/km-reimbursement";
import {
  IconCar, IconPlus, IconSettings, IconTrash,
  IconClock, IconRoute, IconMapPin,
  IconGasStation, IconReceipt, IconChevronRight,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "submitted") {
    return (
      <span style={{
        fontSize: 10, padding: "2px 8px", borderRadius: 999,
        background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)",
        color: "#FBBF24", fontWeight: 700, letterSpacing: 0.3,
      }}>
        Enviado
      </span>
    );
  }
  return (
    <span style={{
      fontSize: 10, padding: "2px 8px", borderRadius: 999,
      background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.25)",
      color: "var(--color-cyan)", fontWeight: 700, letterSpacing: 0.3,
    }}>
      Em aberto
    </span>
  );
}

function PeriodCard({ period }: { period: KmPeriodSummary }) {
  const [isPending, start] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Excluir "${period.name}"? Esta ação não pode ser desfeita.`)) return;
    start(() => deleteKmPeriod(period.id));
  }

  return (
    <Link
      href={`/km-reimbursement/${period.id}`}
      className="group block bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[14px] px-5 py-4 hover:border-[var(--color-cyan-border)] transition-all no-underline"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[14px] font-semibold text-[var(--color-f1)] truncate">{period.name}</span>
            <StatusBadge status={period.status} />
          </div>
          <div className="text-[11px] text-[var(--color-f4)] mb-3">
            {fmtDate(period.startDate)} → {fmtDate(period.endDate)}
            {" · "}
            <span className="capitalize">{period.fuelType === "ethanol" ? "Etanol" : "Gasolina"}</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] text-[var(--color-f3)]">
              <IconRoute size={12} className="text-[var(--color-f4)]" />
              {period._count.routes} trajeto{period._count.routes !== 1 ? "s" : ""}
              {" · "}{period.totalKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[var(--color-f3)]">
              <IconGasStation size={12} className="text-[var(--color-f4)]" />
              {period._count.receipts} nota{period._count.receipts !== 1 ? "s" : ""}
            </span>
            {period._count.expenses > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-[var(--color-f3)]">
                <IconReceipt size={12} className="text-[var(--color-f4)]" />
                {period._count.expenses} despesa{period._count.expenses !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Right: total + actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="text-[18px] font-bold font-[family-name:var(--font-display)] italic text-[var(--color-f1)]">
              {fmt(period.grandTotal)}
            </div>
            {period.status === "submitted" && period.expectedPayAt && (
              <div className="text-[10px] text-[var(--color-amber)] flex items-center gap-1 justify-end mt-0.5">
                <IconClock size={10} />
                Previsto {fmtDate(period.expectedPayAt)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              disabled={isPending}
              title="Excluir período"
              className="w-7 h-7 rounded-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[rgba(239,68,68,0.12)] text-[var(--color-f4)] hover:text-red-400 cursor-pointer border-0 bg-transparent"
            >
              <IconTrash size={13} />
            </button>
            <IconChevronRight size={15} className="text-[var(--color-f4)] group-hover:text-[var(--color-cyan)] transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PeriodList({ periods }: { periods: KmPeriodSummary[] }) {
  const submitted = periods.filter(p => p.status === "submitted");
  const open      = periods.filter(p => p.status === "open");

  const totalReceived = submitted.reduce((s, p) => s + p.grandTotal, 0);
  const totalPending  = open.reduce((s, p) => s + p.grandTotal, 0);

  return (
    <div className="p-8 max-w-[860px]">
      {/* Header */}
      <div className="mb-8">
        <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
          Análise
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] mb-2 leading-tight">
              Reem<span className="text-[var(--color-cyan)]">bolso Especial</span>
            </h1>
            <p className="text-[var(--color-f3)] text-sm">
              Controle de quilometragem, combustível e despesas de viagem.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            <Link
              href="/km-reimbursement/places"
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] text-[var(--color-f3)] bg-[var(--color-bg3)] border border-[var(--color-border2)] hover:text-[var(--color-f1)] hover:border-[var(--color-border)] transition-all no-underline"
            >
              <IconMapPin size={13} />
              Lugares
            </Link>
            <Link
              href="/km-reimbursement/settings"
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] text-[var(--color-f3)] bg-[var(--color-bg3)] border border-[var(--color-border2)] hover:text-[var(--color-f1)] hover:border-[var(--color-border)] transition-all no-underline"
            >
              <IconSettings size={13} />
              Parâmetros
            </Link>
            <Link
              href="/km-reimbursement/new"
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-medium text-white bg-[var(--color-cyan)] hover:opacity-90 transition-opacity no-underline"
              style={{ background: "var(--color-cyan)" }}
            >
              <IconPlus size={13} />
              Nova Solicitação
            </Link>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {periods.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Total recebido",
              value: fmt(totalReceived),
              sub: `${submitted.length} solicitaç${submitted.length !== 1 ? "ões" : "ão"} enviada${submitted.length !== 1 ? "s" : ""}`,
              color: "var(--color-green)",
            },
            {
              label: "Em aberto",
              value: fmt(totalPending),
              sub: `${open.length} solicitaç${open.length !== 1 ? "ões" : "ão"} pendente${open.length !== 1 ? "s" : ""}`,
              color: "var(--color-cyan)",
            },
            {
              label: "Total registrado",
              value: fmt(totalReceived + totalPending),
              sub: `${periods.length} solicitaç${periods.length !== 1 ? "ões" : "ão"} no total`,
              color: "var(--color-f2)",
            },
          ].map(c => (
            <div key={c.label} className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] px-5 py-4">
              <div className="text-[9px] uppercase tracking-[1.5px] text-[var(--color-f4)] mb-2">{c.label}</div>
              <div className="text-[22px] font-bold font-[family-name:var(--font-display)] italic" style={{ color: c.color }}>
                {c.value}
              </div>
              <div className="text-[10px] text-[var(--color-f4)] mt-1">{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {periods.length === 0 && (
        <div className="flex flex-col items-center text-center py-20 bg-[var(--color-bg2)] border border-dashed border-[var(--color-border2)] rounded-[14px]">
          <IconCar size={40} className="text-[var(--color-f4)] mb-4 opacity-40" />
          <div className="text-[14px] font-medium text-[var(--color-f2)] mb-2">Nenhuma solicitação ainda</div>
          <div className="text-[12px] text-[var(--color-f4)] max-w-xs mb-5">
            Crie sua primeira solicitação de reembolso com trajetos, notas de combustível e despesas.
          </div>
          <Link
            href="/km-reimbursement/new"
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-medium text-white no-underline hover:opacity-90 transition-opacity"
            style={{ background: "var(--color-cyan)" }}
          >
            <IconPlus size={13} />
            Nova Solicitação
          </Link>
        </div>
      )}

      {/* Open periods */}
      {open.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">Em aberto</div>
            <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[rgba(34,211,238,0.1)] text-[var(--color-cyan)] border border-[rgba(34,211,238,0.2)]">
              {open.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {open.map(p => <PeriodCard key={p.id} period={p} />)}
          </div>
        </div>
      )}

      {/* Submitted periods */}
      {submitted.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">Enviados</div>
            <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[rgba(251,191,36,0.1)] text-[var(--color-amber)] border border-[rgba(251,191,36,0.2)]">
              {submitted.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {submitted.map(p => <PeriodCard key={p.id} period={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}

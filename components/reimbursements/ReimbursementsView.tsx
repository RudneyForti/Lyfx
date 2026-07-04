"use client";

import { useTransition } from "react";
import { markReimbursed, unmarkReimbursed } from "@/app/actions/transactions";
import { Transaction } from "@/lib/types";
import { getCategoryDef } from "@/lib/categories";
import {
  IconCheck,
  IconClock,
  IconRotate,
  IconReceipt2,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ReimbursementRow({ tx }: { tx: Transaction }) {
  const [isPending, startTransition] = useTransition();
  const isPaid = !!tx.reimbursedAt;
  const cat = getCategoryDef(tx.category as any);
  const date = new Date(tx.date);
  const reimbDate = tx.reimbursedAt ? new Date(tx.reimbursedAt as unknown as string) : null;

  function toggle() {
    startTransition(() =>
      isPaid ? unmarkReimbursed(tx.id) : markReimbursed(tx.id)
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-5 py-3.5 border-b border-[var(--color-border)] last:border-0 transition-colors",
        isPaid && "opacity-60"
      )}
    >
      {/* Toggle button */}
      <button
        onClick={toggle}
        disabled={isPending}
        title={isPaid ? "Desfazer" : "Marcar como reembolsada"}
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-all cursor-pointer",
          isPaid
            ? "bg-[rgba(163,230,53,0.15)] border-[rgba(163,230,53,0.5)]"
            : "bg-[var(--color-bg4)] border-[var(--color-border2)] hover:border-[rgba(163,230,53,0.5)]"
        )}
      >
        {isPending ? (
          <IconRotate size={12} className="animate-spin text-[var(--color-f4)]" />
        ) : isPaid ? (
          <IconCheck size={13} className="text-[var(--color-green)]" />
        ) : null}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-[13px] font-medium truncate",
              isPaid ? "line-through text-[var(--color-f4)]" : "text-[var(--color-f1)]"
            )}
          >
            {tx.description}
          </span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-[4px] border flex-shrink-0"
            style={{
              color: "var(--color-f4)",
              borderColor: "var(--color-border)",
              background: "var(--color-bg4)",
            }}
          >
            {cat.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[10px] text-[var(--color-f4)]">
            {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}
          </span>
          {isPaid && reimbDate && (
            <span className="text-[10px] text-[var(--color-green)]">
              Reembolsada em {reimbDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" })}
            </span>
          )}
          {!isPaid && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--color-amber)]">
              <IconClock size={10} />
              Aguardando reembolso
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <div className={cn(
          "text-[14px] font-semibold",
          isPaid ? "text-[var(--color-f4)]" : "text-[var(--color-f1)]"
        )}>
          {fmt(tx.amount)}
        </div>
      </div>
    </div>
  );
}

export function ReimbursementsView({ transactions }: { transactions: Transaction[] }) {
  const pending   = transactions.filter((t) => !t.reimbursedAt);
  const reimbursed = transactions.filter((t) => !!t.reimbursedAt);

  const totalPending    = pending.reduce((s, t) => s + t.amount, 0);
  const totalReimbursed = reimbursed.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-8 max-w-[860px]">
      {/* Header */}
      <div className="mb-8">
        <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
          Controle
        </div>
        <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] mb-2 leading-tight">
          Reem<span className="text-[var(--color-cyan)]">bolsos</span>
        </h1>
        <p className="text-[var(--color-f3)] text-sm">
          Despesas marcadas como reembolsáveis e seu status de recebimento.
        </p>
      </div>

      {/* Summary cards */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "A receber",
              value: fmt(totalPending),
              sub: `${pending.length} despesa${pending.length !== 1 ? "s" : ""} pendente${pending.length !== 1 ? "s" : ""}`,
              color: "var(--color-amber)",
            },
            {
              label: "Já reembolsado",
              value: fmt(totalReimbursed),
              sub: `${reimbursed.length} reembolso${reimbursed.length !== 1 ? "s" : ""} recebido${reimbursed.length !== 1 ? "s" : ""}`,
              color: "var(--color-green)",
            },
            {
              label: "Total registrado",
              value: fmt(totalPending + totalReimbursed),
              sub: `${transactions.length} despesa${transactions.length !== 1 ? "s" : ""} reembolsável${transactions.length !== 1 ? "s" : ""}`,
              color: "var(--color-f2)",
            },
          ].map((c) => (
            <div
              key={c.label}
              className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] px-5 py-4"
            >
              <div className="text-[9px] uppercase tracking-[1.5px] text-[var(--color-f4)] mb-2">
                {c.label}
              </div>
              <div
                className="text-[22px] font-bold font-[family-name:var(--font-display)] italic"
                style={{ color: c.color }}
              >
                {c.value}
              </div>
              <div className="text-[10px] text-[var(--color-f4)] mt-1">{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {transactions.length === 0 && (
        <div className="flex flex-col items-center text-center py-20 bg-[var(--color-bg2)] border border-dashed border-[var(--color-border2)] rounded-[14px]">
          <IconReceipt2 size={40} className="text-[var(--color-f4)] mb-4 opacity-40" />
          <div className="text-[14px] font-medium text-[var(--color-f2)] mb-2">
            Nenhuma despesa reembolsável
          </div>
          <div className="text-[12px] text-[var(--color-f4)] max-w-xs">
            Ao registrar uma transação marcada como "Reembolsável", ela aparecerá aqui para acompanhamento.
          </div>
        </div>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">
              Aguardando reembolso
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[rgba(251,191,36,0.1)] text-[var(--color-amber)] border border-[rgba(251,191,36,0.2)]">
              {pending.length}
            </span>
          </div>
          <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] overflow-hidden">
            {pending.map((tx) => (
              <ReimbursementRow key={tx.id} tx={tx} />
            ))}
          </div>
        </div>
      )}

      {/* Reimbursed */}
      {reimbursed.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">
              Reembolsadas
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[rgba(163,230,53,0.1)] text-[var(--color-green)] border border-[rgba(163,230,53,0.2)]">
              {reimbursed.length}
            </span>
          </div>
          <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] overflow-hidden">
            {reimbursed.map((tx) => (
              <ReimbursementRow key={tx.id} tx={tx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

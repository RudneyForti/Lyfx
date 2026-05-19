"use client";

import { useState, useMemo } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconArrowUpRight,
  IconArrowDownRight,
  IconX,
  IconRepeat,
} from "@tabler/icons-react";
import { Transaction, TransactionCategory } from "@/lib/types";
import { getProjectedTransactions } from "@/lib/projections";
import { getCategoryDef } from "@/lib/categories";
import { cn } from "@/lib/utils";

interface Props {
  transactions: Transaction[];
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function fmtShort(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toFixed(0);
}

type AnyTransaction = Transaction & { isProjected?: boolean };

interface DayData {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  transactions: AnyTransaction[];
  creditTotal: number;
  debitTotal: number;
  projectedCreditTotal: number;
  projectedDebitTotal: number;
  net: number;
}

export function MonthlyCalendar({ transactions }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Build calendar grid (actual + projected)
  const days = useMemo<DayData[]>(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startOffset = firstDay.getDay();
    const projected = getProjectedTransactions(transactions, viewMonth, viewYear);
    const allTxs: AnyTransaction[] = [...transactions, ...projected];
    const grid: DayData[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(viewYear, viewMonth, -i);
      grid.push({ date, isCurrentMonth: false, isToday: false, transactions: [], creditTotal: 0, debitTotal: 0, projectedCreditTotal: 0, projectedDebitTotal: 0, net: 0 });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(viewYear, viewMonth, d);
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      const dayTxs = allTxs.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate.getDate() === d && txDate.getMonth() === viewMonth && txDate.getFullYear() === viewYear;
      });

      const actual     = dayTxs.filter(t => !t.isProjected);
      const projDay    = dayTxs.filter(t => t.isProjected);
      const creditTotal = actual.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
      const debitTotal  = actual.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
      const projectedCreditTotal = projDay.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
      const projectedDebitTotal  = projDay.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);

      grid.push({ date, isCurrentMonth: true, isToday, transactions: dayTxs, creditTotal, debitTotal, projectedCreditTotal, projectedDebitTotal, net: creditTotal - debitTotal });
    }

    const remaining = 7 - (grid.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const date = new Date(viewYear, viewMonth + 1, i);
        grid.push({ date, isCurrentMonth: false, isToday: false, transactions: [], creditTotal: 0, debitTotal: 0, projectedCreditTotal: 0, projectedDebitTotal: 0, net: 0 });
      }
    }

    return grid;
  }, [viewYear, viewMonth, transactions]);

  // Month totals
  const monthTxs = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });
  const monthCredit = monthTxs.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const monthDebit  = monthTxs.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0);
  const monthNet    = monthCredit - monthDebit;

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-[8px] bg-[var(--color-bg3)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-f3)] hover:bg-[var(--color-bg4)] hover:text-[var(--color-f1)] transition-all cursor-pointer"
          >
            <IconChevronLeft size={15} />
          </button>
          <h2 className="font-[family-name:var(--font-display)] italic text-[22px] font-bold text-[var(--color-f1)] w-52 text-center">
            <span className="text-[var(--color-cyan)]">{MONTHS[viewMonth]}</span> {viewYear}
          </h2>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-[8px] bg-[var(--color-bg3)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-f3)] hover:bg-[var(--color-bg4)] hover:text-[var(--color-f1)] transition-all cursor-pointer"
          >
            <IconChevronRight size={15} />
          </button>
        </div>

        {/* Month summary */}
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-[1.5px] text-[var(--color-f4)]">Receitas</div>
            <div className="text-[13px] font-medium text-[var(--color-green)]">+{fmt(monthCredit)}</div>
          </div>
          <div className="w-px h-8 bg-[var(--color-border)]" />
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-[1.5px] text-[var(--color-f4)]">Despesas</div>
            <div className="text-[13px] font-medium text-[var(--color-red)]">−{fmt(monthDebit)}</div>
          </div>
          <div className="w-px h-8 bg-[var(--color-border)]" />
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-[1.5px] text-[var(--color-f4)]">Resultado</div>
            <div className={cn("text-[13px] font-medium", monthNet >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]")}>
              {monthNet >= 0 ? "+" : "−"}{fmt(Math.abs(monthNet))}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-2.5 text-center text-[9px] font-bold tracking-[1.5px] uppercase text-[var(--color-f4)]">
              {w}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const hasTx = day.transactions.length > 0;
            const isSelected = selectedDay?.date.toDateString() === day.date.toDateString();

            return (
              <div
                key={i}
                onClick={() => hasTx && setSelectedDay(isSelected ? null : day)}
                className={cn(
                  "min-h-[90px] p-2.5 border-b border-r border-[var(--color-border)] flex flex-col gap-1",
                  "last:border-r-0 [&:nth-child(7n)]:border-r-0",
                  !day.isCurrentMonth && "opacity-30",
                  hasTx && "cursor-pointer hover:bg-[var(--color-bg3)]",
                  isSelected && "bg-[var(--color-cyan-faint)] border-[var(--color-cyan-border)]",
                  "transition-colors duration-100"
                )}
              >
                {/* Day number */}
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-medium flex-shrink-0",
                  day.isToday
                    ? "bg-[var(--color-cyan)] text-[#083344] font-bold"
                    : "text-[var(--color-f3)]"
                )}>
                  {day.date.getDate()}
                </div>

                {/* Transaction indicators — one chip per transaction */}
                {hasTx && (
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {day.transactions.map((tx) => {
                      const isCredit = tx.type === "credit";
                      const isProj   = tx.isProjected;
                      return (
                        <div
                          key={tx.id}
                          className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded-[4px]",
                            isProj
                              ? cn("border border-dashed opacity-60", isCredit ? "border-[var(--color-green-border)]" : "border-[var(--color-red-border)]")
                              : cn("border", isCredit ? "bg-[var(--color-green-dim)] border-[var(--color-green-border)]" : "bg-[var(--color-red-dim)] border-[var(--color-red-border)]")
                          )}
                        >
                          {isProj
                            ? <IconRepeat size={8} className={cn("flex-shrink-0", isCredit ? "text-[var(--color-green)]" : "text-[var(--color-red)]")} />
                            : isCredit
                              ? <IconArrowUpRight size={9} className="text-[var(--color-green)] flex-shrink-0" />
                              : <IconArrowDownRight size={9} className="text-[var(--color-red)] flex-shrink-0" />
                          }
                          <span className={cn("text-[9px] font-medium truncate", isCredit ? "text-[var(--color-green)]" : "text-[var(--color-red)]")}>
                            {tx.description}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div className="bg-[var(--color-bg2)] border border-[var(--color-cyan-border)] rounded-[12px] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[9px] uppercase tracking-[1.5px] text-[var(--color-f4)] mb-1">Detalhe do dia</div>
              <div className="font-[family-name:var(--font-display)] italic text-[18px] font-bold text-[var(--color-f1)]">
                {selectedDay.date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {selectedDay.creditTotal > 0 && (
                <div className="text-right">
                  <div className="text-[9px] text-[var(--color-f4)]">Entrou</div>
                  <div className="text-[13px] font-medium text-[var(--color-green)]">+{fmt(selectedDay.creditTotal)}</div>
                </div>
              )}
              {selectedDay.debitTotal > 0 && (
                <div className="text-right">
                  <div className="text-[9px] text-[var(--color-f4)]">Saiu</div>
                  <div className="text-[13px] font-medium text-[var(--color-red)]">−{fmt(selectedDay.debitTotal)}</div>
                </div>
              )}
              <button
                onClick={() => setSelectedDay(null)}
                className="w-7 h-7 rounded-[6px] bg-[var(--color-bg4)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-f3)] hover:text-[var(--color-f1)] hover:bg-[var(--color-bg5)] transition-all cursor-pointer"
              >
                <IconX size={13} />
              </button>
            </div>
          </div>

          <div className="flex flex-col">
            {selectedDay.transactions.map((tx) => {
              const cat = getCategoryDef(tx.category as TransactionCategory);
              const isCredit = tx.type === "credit";
              const isProj = tx.isProjected;
              return (
                <div key={tx.id} className={cn("flex items-center gap-3 py-2.5 border-b border-[var(--color-border)] last:border-0", isProj && "opacity-60")}>
                  <div className={cn(
                    "w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0 border",
                    isProj ? "border-dashed" : "",
                    isCredit
                      ? "bg-[var(--color-green-dim)] border-[var(--color-green-border)] text-[var(--color-green)]"
                      : "bg-[var(--color-red-dim)] border-[var(--color-red-border)] text-[var(--color-red)]"
                  )}>
                    {isProj ? <IconRepeat size={13} /> : isCredit ? <IconArrowUpRight size={13} /> : <IconArrowDownRight size={13} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-[var(--color-f1)] truncate">{tx.description}</span>
                      {isProj && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[var(--color-bg4)] text-[var(--color-f4)] border border-[var(--color-border2)] flex-shrink-0">
                          prevista
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--color-f4)]">{cat.label}</div>
                  </div>
                  <div className={cn("text-[13px] font-medium", isCredit ? "text-[var(--color-green)]" : "text-[var(--color-red)]")}>
                    {isCredit ? "+" : "−"}{fmt(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

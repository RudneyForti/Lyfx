"use client";

import { useState, useTransition } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPencil,
  IconCheck,
  IconX,
  IconPlus,
} from "@tabler/icons-react";
import { setBudget, deleteBudget, type Budget } from "@/app/actions/budgets";
import { DEBIT_CATEGORIES } from "@/lib/categories";
import { Transaction, TransactionCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  initialBudgets: Budget[];
  allTransactions: Transaction[];
}

const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 100);
  const color =
    pct > 100 ? "#F87171" :
    pct > 75  ? "#FBBF24" :
                "#A3E635";
  return (
    <div className="w-full h-1.5 bg-[var(--color-bg4)] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  );
}

function EditableAmount({
  value,
  onSave,
  onRemove,
}: {
  value: number | null;
  onSave: (v: number) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value != null ? String(value) : "");

  function commit() {
    const n = Number(input);
    if (n > 0) { onSave(n); setEditing(false); }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-[var(--color-f4)]">R$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          autoFocus
          className="w-24 bg-[var(--color-bg4)] border border-[var(--color-cyan-border)] rounded-[6px] px-2 py-1 text-[12px] text-[var(--color-f1)] outline-none"
        />
        <button onClick={commit} className="text-[var(--color-cyan)] hover:opacity-70 cursor-pointer transition-opacity">
          <IconCheck size={13} />
        </button>
        <button onClick={() => setEditing(false)} className="text-[var(--color-f4)] hover:text-[var(--color-f2)] cursor-pointer transition-colors">
          <IconX size={13} />
        </button>
      </div>
    );
  }

  if (value != null) {
    return (
      <div className="flex items-center gap-1.5 group/edit">
        <span className="text-[13px] font-medium text-[var(--color-f1)]">{fmt(value)}</span>
        <button
          onClick={() => { setInput(String(value)); setEditing(true); }}
          className="opacity-0 group-hover/edit:opacity-100 transition-opacity cursor-pointer text-[var(--color-f4)] hover:text-[var(--color-cyan)]"
        >
          <IconPencil size={11} />
        </button>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover/edit:opacity-100 transition-opacity cursor-pointer text-[var(--color-f4)] hover:text-[var(--color-red)]"
        >
          <IconX size={11} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setInput(""); setEditing(true); }}
      className="flex items-center gap-1 text-[11px] text-[var(--color-f4)] hover:text-[var(--color-cyan)] transition-colors cursor-pointer"
    >
      <IconPlus size={11} />
      Definir limite
    </button>
  );
}

export function BudgetView({ initialBudgets, allTransactions }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [, startTransition] = useTransition();

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  // Transactions for the selected month
  const monthTxs = allTransactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear && tx.type === "debit";
  });

  const spentByCategory = (cat: TransactionCategory) =>
    monthTxs.filter((t) => t.category === cat).reduce((s, t) => s + t.amount, 0);

  const getBudgetFor = (cat: string) =>
    budgets.find((b) => b.category === cat)?.amount ?? null;

  // Totals
  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = monthTxs.reduce((s, t) => s + t.amount, 0);
  const totalAvailable = totalBudgeted - totalSpent;

  function handleSave(category: TransactionCategory, amount: number) {
    startTransition(async () => {
      const updated = await setBudget(category, amount);
      setBudgets((prev) => {
        const exists = prev.find((b) => b.category === category);
        if (exists) return prev.map((b) => b.category === category ? updated : b);
        return [...prev, updated];
      });
    });
  }

  function handleRemove(category: TransactionCategory) {
    startTransition(async () => {
      await deleteBudget(category);
      setBudgets((prev) => prev.filter((b) => b.category !== category));
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Month nav + summary */}
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

        {/* Summary chips */}
        {totalBudgeted > 0 && (
          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-[1.5px] text-[var(--color-f4)]">Orçado</div>
              <div className="text-[13px] font-medium text-[var(--color-f2)]">{fmt(totalBudgeted)}</div>
            </div>
            <div className="w-px h-8 bg-[var(--color-border)]" />
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-[1.5px] text-[var(--color-f4)]">Gasto</div>
              <div className="text-[13px] font-medium text-[var(--color-red)]">{fmt(totalSpent)}</div>
            </div>
            <div className="w-px h-8 bg-[var(--color-border)]" />
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-[1.5px] text-[var(--color-f4)]">Disponível</div>
              <div className={cn(
                "text-[13px] font-medium",
                totalAvailable >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]"
              )}>
                {totalAvailable >= 0 ? fmt(totalAvailable) : `−${fmt(Math.abs(totalAvailable))}`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category rows */}
      <div className="flex flex-col gap-3">
        {DEBIT_CATEGORIES.map((cat) => {
          const spent = spentByCategory(cat.value);
          const limit = getBudgetFor(cat.value);
          const pct = limit != null && limit > 0 ? (spent / limit) * 100 : 0;
          const overBudget = limit != null && spent > limit;

          return (
            <div
              key={cat.value}
              className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] px-5 py-4 flex flex-col gap-3 hover:border-[var(--color-border2)] transition-colors"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[13px] font-semibold text-[var(--color-f1)]">{cat.label}</div>
                  <div className="text-[10px] text-[var(--color-f4)] mt-0.5">{cat.examples}</div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <EditableAmount
                    value={limit}
                    onSave={(v) => handleSave(cat.value, v)}
                    onRemove={() => handleRemove(cat.value)}
                  />
                  {limit != null && (
                    <div className="text-[10px] text-[var(--color-f4)]">
                      limite mensal
                    </div>
                  )}
                </div>
              </div>

              {/* Progress section */}
              {limit != null ? (
                <div className="flex flex-col gap-1.5">
                  <ProgressBar pct={pct} />
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[11px] font-medium",
                      overBudget ? "text-[var(--color-red)]" : "text-[var(--color-f3)]"
                    )}>
                      {fmt(spent)} gasto
                      {overBudget && ` · ultrapassou em ${fmt(spent - limit)}`}
                    </span>
                    <span className={cn(
                      "text-[11px] font-medium",
                      pct > 100 ? "text-[var(--color-red)]" :
                      pct > 75  ? "text-[#FBBF24]" :
                                  "text-[var(--color-f4)]"
                    )}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ) : (
                spent > 0 && (
                  <div className="text-[11px] text-[var(--color-f4)]">
                    {fmt(spent)} gasto sem limite definido
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

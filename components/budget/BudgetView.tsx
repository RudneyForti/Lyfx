"use client";

import { useState, useTransition } from "react";
import {
  IconChevronLeft, IconChevronRight,
  IconPencil, IconCheck, IconX, IconPlus,
} from "@tabler/icons-react";
import { setBudget, deleteBudget, type Budget } from "@/app/actions/budgets";
import { updateExpectedIncome } from "@/app/actions/settings";
import { DEBIT_CATEGORIES } from "@/lib/categories";
import { Transaction, TransactionCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  initialBudgets: Budget[];
  allTransactions: Transaction[];
  initialExpectedIncome: number;
}

const MONTHS = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function ProgressBar({ pct, color = "auto" }: { pct: number; color?: string }) {
  const clamped = Math.min(pct, 100);
  const barColor = color === "auto"
    ? pct > 100 ? "#F87171" : pct > 75 ? "#FBBF24" : "#A3E635"
    : color;
  return (
    <div className="w-full h-1.5 bg-[var(--color-bg4)] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${clamped}%`, backgroundColor: barColor }}
      />
    </div>
  );
}

// Editable field for a single monetary value (used for income target)
function InlineEdit({
  value,
  onSave,
  emptyLabel = "Definir valor",
  displayClass = "text-[20px] font-bold font-[family-name:var(--font-display)] italic text-[var(--color-green)]",
}: {
  value: number;
  onSave: (v: number) => void;
  emptyLabel?: string;
  displayClass?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(value || ""));

  function commit() {
    const n = Number(input);
    if (n >= 0) { onSave(n); setEditing(false); }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-[var(--color-f4)]">R$</span>
        <input
          type="number" step="0.01" min="0" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          autoFocus
          className="w-32 bg-[var(--color-bg4)] border border-[var(--color-cyan-border)] rounded-[6px] px-2 py-1 text-[13px] text-[var(--color-f1)] outline-none"
        />
        <button onClick={commit} className="text-[var(--color-cyan)] hover:opacity-70 cursor-pointer transition-opacity">
          <IconCheck size={14} />
        </button>
        <button onClick={() => setEditing(false)} className="text-[var(--color-f4)] hover:text-[var(--color-f2)] cursor-pointer transition-colors">
          <IconX size={14} />
        </button>
      </div>
    );
  }

  if (value > 0) {
    return (
      <div className="flex items-center gap-2 group/edit">
        <span className={displayClass}>{fmt(value)}</span>
        <button
          onClick={() => { setInput(String(value)); setEditing(true); }}
          className="opacity-0 group-hover/edit:opacity-100 transition-opacity cursor-pointer text-[var(--color-f4)] hover:text-[var(--color-cyan)]"
        >
          <IconPencil size={12} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setInput(""); setEditing(true); }}
      className="flex items-center gap-1.5 text-[11px] text-[var(--color-f4)] hover:text-[var(--color-cyan)] transition-colors cursor-pointer border border-dashed border-[var(--color-border2)] rounded-[6px] px-3 py-1.5"
    >
      <IconPlus size={11} /> {emptyLabel}
    </button>
  );
}

// Editable field for a budget allocation (per category)
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
          type="number" step="0.01" min="0" value={input}
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
      <IconPlus size={11} /> Alocar
    </button>
  );
}

export function BudgetView({ initialBudgets, allTransactions, initialExpectedIncome }: Props) {
  const today = new Date();
  const [viewYear, setViewYear]     = useState(today.getFullYear());
  const [viewMonth, setViewMonth]   = useState(today.getMonth());
  const [budgets, setBudgetsState]  = useState<Budget[]>(initialBudgets);
  const [expectedIncome, setExpectedIncomeState] = useState(initialExpectedIncome);
  const [, startTransition] = useTransition();

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  const monthTxs   = allTransactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });
  const realIncome  = monthTxs.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalSpent  = monthTxs.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
  const totalAllocated = budgets.reduce((s, b) => s + b.amount, 0);

  const spentByCategory = (cat: TransactionCategory) =>
    monthTxs.filter((t) => t.type === "debit" && t.category === cat).reduce((s, t) => s + t.amount, 0);
  const getBudgetFor = (cat: string) =>
    budgets.find((b) => b.category === cat)?.amount ?? null;

  function handleSaveIncome(amount: number) {
    setExpectedIncomeState(amount);
    startTransition(() => { updateExpectedIncome(amount); });
  }

  function handleSaveBudget(category: TransactionCategory, amount: number) {
    startTransition(async () => {
      const updated = await setBudget(category, amount);
      setBudgetsState((prev) => {
        const exists = prev.find((b) => b.category === category);
        if (exists) return prev.map((b) => (b.category === category ? updated : b));
        return [...prev, updated];
      });
    });
  }

  function handleRemoveBudget(category: TransactionCategory) {
    startTransition(async () => {
      await deleteBudget(category);
      setBudgetsState((prev) => prev.filter((b) => b.category !== category));
    });
  }

  const incomeBarPct   = expectedIncome > 0 ? Math.min((realIncome / expectedIncome) * 100, 100) : 0;
  const incomeDiffPct  = expectedIncome > 0 ? (realIncome / expectedIncome) * 100 : 0;
  const plannedBalance = expectedIncome - totalAllocated;
  const realBalance    = realIncome - totalSpent;
  const showBalance    = expectedIncome > 0 || totalAllocated > 0;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Receita ── */}
      <div
        className="bg-[var(--color-bg2)] rounded-[14px] px-5 py-5"
        style={{ border: "1px solid rgba(74,222,128,0.2)" }}
      >
        <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-green)] mb-4">
          Receita
        </div>
        <div className="flex items-start justify-between gap-8 mb-4">
          <div>
            <div className="text-[10px] text-[var(--color-f4)] mb-2">Esperada por mês</div>
            <InlineEdit
              value={expectedIncome}
              onSave={handleSaveIncome}
              emptyLabel="Definir receita esperada"
            />
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[var(--color-f4)] mb-1">
              Real — {MONTHS[viewMonth]} {viewYear}
            </div>
            <div
              className="text-[20px] font-bold font-[family-name:var(--font-display)] italic"
              style={{ color: realIncome > 0 ? "var(--color-green)" : "var(--color-f4)" }}
            >
              {fmt(realIncome)}
            </div>
          </div>
        </div>
        {expectedIncome > 0 && (
          <>
            <ProgressBar pct={incomeBarPct} color="var(--color-green)" />
            <div className="flex items-center justify-between mt-1.5">
              <span className={cn(
                "text-[11px] font-medium",
                realIncome >= expectedIncome ? "text-[var(--color-green)]" : "text-[var(--color-f4)]"
              )}>
                {realIncome >= expectedIncome
                  ? `+${fmt(realIncome - expectedIncome)} acima do esperado`
                  : `${fmt(expectedIncome - realIncome)} a receber`}
              </span>
              <span className="text-[11px] text-[var(--color-f4)]">
                {incomeDiffPct.toFixed(0)}% recebido
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Despesas: nav + resumo ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth}
            className="w-8 h-8 rounded-[12px] bg-[var(--color-bg3)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-f3)] hover:bg-[var(--color-bg4)] hover:text-[var(--color-f1)] transition-all cursor-pointer">
            <IconChevronLeft size={15} />
          </button>
          <h2 className="font-[family-name:var(--font-display)] italic text-[20px] font-bold text-[var(--color-f1)] w-44 text-center">
            <span className="text-[var(--color-cyan)]">{MONTHS[viewMonth]}</span> {viewYear}
          </h2>
          <button onClick={nextMonth}
            className="w-8 h-8 rounded-[12px] bg-[var(--color-bg3)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-f3)] hover:bg-[var(--color-bg4)] hover:text-[var(--color-f1)] transition-all cursor-pointer">
            <IconChevronRight size={15} />
          </button>
        </div>

        {(totalAllocated > 0 || totalSpent > 0) && (
          <div className="flex items-center gap-4">
            {totalAllocated > 0 && (
              <>
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-[1.5px] text-[var(--color-f4)]">Alocado</div>
                  <div className="text-[13px] font-medium text-[var(--color-f2)]">{fmt(totalAllocated)}</div>
                </div>
                <div className="w-px h-7 bg-[var(--color-border)]" />
              </>
            )}
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-[1.5px] text-[var(--color-f4)]">Gasto</div>
              <div className="text-[13px] font-medium text-[var(--color-red)]">{fmt(totalSpent)}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Categorias ── */}
      <div className="flex flex-col gap-2.5">
        {DEBIT_CATEGORIES.map((cat) => {
          const spent      = spentByCategory(cat.value);
          const limit      = getBudgetFor(cat.value);
          const pct        = limit != null && limit > 0 ? (spent / limit) * 100 : 0;
          const overBudget = limit != null && spent > limit;
          const pctOfIncome = expectedIncome > 0 && limit != null
            ? Math.round((limit / expectedIncome) * 100)
            : null;

          return (
            <div
              key={cat.value}
              className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] px-5 py-4 hover:border-[var(--color-border2)] transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-[var(--color-f1)]">{cat.label}</div>
                  <div className="text-[10px] text-[var(--color-f4)] mt-0.5">{cat.examples}</div>
                </div>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <EditableAmount
                    value={limit}
                    onSave={(v) => handleSaveBudget(cat.value, v)}
                    onRemove={() => handleRemoveBudget(cat.value)}
                  />
                  {pctOfIncome != null && (
                    <div className="text-[9px] text-[var(--color-f4)]">
                      {pctOfIncome}% da receita esperada
                    </div>
                  )}
                </div>
              </div>

              {limit != null ? (
                <div className="flex flex-col gap-1.5">
                  <ProgressBar pct={pct} />
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[11px] font-medium",
                      overBudget ? "text-[var(--color-red)]" : "text-[var(--color-f3)]"
                    )}>
                      {fmt(spent)} gasto
                      {overBudget && ` · +${fmt(spent - limit)} acima`}
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
                    {fmt(spent)} gasto sem alocação definida
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* ── Balanço ── */}
      {showBalance && (
        <div className="bg-[var(--color-bg2)] border border-[var(--color-border2)] rounded-[14px] px-5 py-5">
          <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-5">
            Balanço
          </div>
          <div className="grid grid-cols-2 gap-8">

            {/* Planejado */}
            <div>
              <div className="text-[10px] font-semibold text-[var(--color-f3)] mb-4 pb-2 border-b border-[var(--color-border)]">
                Planejado
              </div>
              <div className="flex flex-col gap-3 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-f4)]">Receita esperada</span>
                  <span className="font-medium text-[var(--color-green)]">{fmt(expectedIncome)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-f4)]">Total alocado</span>
                  <span className="font-medium text-[var(--color-red)]">−{fmt(totalAllocated)}</span>
                </div>
                <div className="h-px bg-[var(--color-border)]" />
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-f2)] font-medium">Sobra planejada</span>
                  <span className={cn(
                    "font-bold text-[14px]",
                    plannedBalance >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]"
                  )}>
                    {plannedBalance >= 0 ? "+" : "−"}{fmt(Math.abs(plannedBalance))}
                  </span>
                </div>
              </div>
            </div>

            {/* Real */}
            <div>
              <div className="text-[10px] font-semibold text-[var(--color-f3)] mb-4 pb-2 border-b border-[var(--color-border)]">
                Real — {MONTHS[viewMonth]} {viewYear}
              </div>
              <div className="flex flex-col gap-3 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-f4)]">Receita real</span>
                  <span className="font-medium text-[var(--color-green)]">{fmt(realIncome)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-f4)]">Total gasto</span>
                  <span className="font-medium text-[var(--color-red)]">−{fmt(totalSpent)}</span>
                </div>
                <div className="h-px bg-[var(--color-border)]" />
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-f2)] font-medium">Resultado real</span>
                  <span className={cn(
                    "font-bold text-[14px]",
                    realBalance >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]"
                  )}>
                    {realBalance >= 0 ? "+" : "−"}{fmt(Math.abs(realBalance))}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MonthReport, CategoryTotal } from "@/app/actions/reports";
import { cn } from "@/lib/utils";

interface ContextBreakdown {
  personal:     { income: number; expense: number };
  professional: { income: number; expense: number };
  none:         { income: number; expense: number };
}

interface Props {
  data: {
    months: MonthReport[];
    categoryTotals: CategoryTotal[];
    totalIncome: number;
    totalExpense: number;
    avgMonthlyResult: number;
    contextBreakdown: ContextBreakdown;
  };
}

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtShort(v: number) {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1).replace(".", ",")}k`;
  return v.toFixed(0);
}

function PeriodSelector({ current, onChange }: { current: number; onChange: (v: number) => void }) {
  const options = [3, 6, 12];
  return (
    <div className="flex gap-1 bg-[var(--color-bg3)] border border-[var(--color-border)] rounded-[10px] p-1">
      {options.map(o => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            "px-3 py-1.5 rounded-[7px] text-[11px] font-medium transition-all cursor-pointer",
            current === o
              ? "bg-[var(--color-cyan-dim)] text-[var(--color-cyan)] border border-[var(--color-cyan-border)]"
              : "text-[var(--color-f3)] hover:text-[var(--color-f2)]"
          )}
        >
          {o}M
        </button>
      ))}
    </div>
  );
}

function TrendChart({ months }: { months: MonthReport[] }) {
  const maxVal = Math.max(...months.map(m => Math.max(m.income, m.expense)), 1);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] p-5">
      <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-5">
        Evolução mensal
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-5">
        {[
          { color: "var(--color-green)", label: "Receita" },
          { color: "var(--color-red)", label: "Despesa" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[10px] text-[var(--color-f3)]">{label}</span>
          </div>
        ))}
      </div>

      {/* Bars */}
      <div className="flex items-end gap-2" style={{ height: 140 }}>
        {months.map((m, i) => {
          const incH = Math.round((m.income / maxVal) * 120);
          const expH = Math.round((m.expense / maxVal) * 120);
          const isHov = hovered === i;

          return (
            <div
              key={`${m.year}-${m.month}`}
              className="flex-1 flex flex-col items-center gap-1 cursor-default group"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {isHov && (
                <div className="absolute z-20 bg-[var(--color-bg4)] border border-[var(--color-border2)] rounded-[10px] p-3 text-[11px] shadow-xl pointer-events-none -translate-y-2 whitespace-nowrap">
                  <div className="font-semibold text-[var(--color-f1)] mb-1">{m.label}</div>
                  <div className="text-[var(--color-green)]">+ {fmt(m.income)}</div>
                  <div className="text-[var(--color-red)]">− {fmt(m.expense)}</div>
                  <div className={cn("font-medium mt-1", m.result >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]")}>
                    = {m.result >= 0 ? "+" : "−"}{fmt(Math.abs(m.result))}
                  </div>
                </div>
              )}

              <div className="relative flex items-end gap-0.5 w-full justify-center" style={{ height: 120 }}>
                {/* Income bar */}
                <div
                  className="w-[45%] rounded-t-[3px] transition-opacity duration-150"
                  style={{
                    height: incH,
                    background: "var(--color-green)",
                    opacity: isHov ? 1 : 0.7,
                  }}
                />
                {/* Expense bar */}
                <div
                  className="w-[45%] rounded-t-[3px] transition-opacity duration-150"
                  style={{
                    height: expH,
                    background: "var(--color-red)",
                    opacity: isHov ? 1 : 0.7,
                  }}
                />
              </div>

              {/* Label */}
              <div className="text-[9px] text-[var(--color-f4)] whitespace-nowrap">{m.label}</div>

              {/* Result indicator */}
              <div className={cn(
                "text-[8px] font-medium",
                m.result >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]"
              )}>
                {m.result >= 0 ? "+" : "−"}{fmtShort(Math.abs(m.result))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryBreakdown({ categoryTotals, months }: { categoryTotals: CategoryTotal[]; months: number }) {
  const credits = categoryTotals.filter(c => c.type === "credit");
  const debits  = categoryTotals.filter(c => c.type === "debit");

  const maxDebit = Math.max(...debits.map(d => d.total), 1);

  return (
    <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] p-5">
      <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-5">
        Por categoria
      </div>

      {credits.length > 0 && (
        <div className="mb-5">
          <div className="text-[10px] font-semibold text-[var(--color-green)] mb-2">Receitas</div>
          <div className="flex flex-col gap-1.5">
            {credits.map(cat => (
              <div key={cat.category} className="flex items-center gap-3">
                <div className="text-[11px] text-[var(--color-f2)] w-[140px] shrink-0">{cat.label}</div>
                <div className="flex-1 h-1.5 bg-[var(--color-bg4)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-green)]"
                    style={{ width: `${(cat.total / Math.max(...credits.map(c => c.total), 1)) * 100}%`, opacity: 0.75 }}
                  />
                </div>
                <div className="text-[11px] font-mono text-[var(--color-f2)] w-[90px] text-right shrink-0">{fmt(cat.total)}</div>
                <div className="text-[10px] text-[var(--color-f4)] w-[90px] text-right shrink-0">{fmt(cat.avg)}/mês</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {debits.length > 0 && (
        <div>
          <div className="text-[10px] font-semibold text-[var(--color-red)] mb-2">Despesas</div>
          <div className="flex flex-col gap-1.5">
            {debits.sort((a, b) => b.total - a.total).map(cat => (
              <div key={cat.category} className="flex items-center gap-3">
                <div className="text-[11px] text-[var(--color-f2)] w-[140px] shrink-0">{cat.label}</div>
                <div className="flex-1 h-1.5 bg-[var(--color-bg4)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-red)]"
                    style={{ width: `${(cat.total / maxDebit) * 100}%`, opacity: 0.75 }}
                  />
                </div>
                <div className="text-[11px] font-mono text-[var(--color-f2)] w-[90px] text-right shrink-0">{fmt(cat.total)}</div>
                <div className="text-[10px] text-[var(--color-f4)] w-[90px] text-right shrink-0">{fmt(cat.avg)}/mês</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MonthTable({ months }: { months: MonthReport[] }) {
  return (
    <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)]">
        <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">
          Detalhe por período
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left px-5 py-2.5 text-[10px] font-semibold text-[var(--color-f4)]">Mês</th>
              <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[var(--color-green)]">Receita</th>
              <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-[var(--color-red)]">Despesa</th>
              <th className="text-right px-5 py-2.5 text-[10px] font-semibold text-[var(--color-f3)]">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {[...months].reverse().map((m) => (
              <tr key={`${m.year}-${m.month}`} className="border-b border-[var(--color-border)] last:border-0 hover:bg-white/[0.02]">
                <td className="px-5 py-3 text-[var(--color-f2)] font-medium">{m.label}</td>
                <td className="px-4 py-3 text-right font-mono text-[var(--color-green)]">{fmt(m.income)}</td>
                <td className="px-4 py-3 text-right font-mono text-[var(--color-red)]">{fmt(m.expense)}</td>
                <td className={cn("px-5 py-3 text-right font-mono font-semibold", m.result >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]")}>
                  {m.result >= 0 ? "+" : "−"}{fmt(Math.abs(m.result))}
                </td>
              </tr>
            ))}
          </tbody>
          {months.length > 1 && (
            <tfoot>
              <tr className="bg-[var(--color-bg3)]">
                <td className="px-5 py-3 text-[11px] font-semibold text-[var(--color-f3)]">Total período</td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--color-green)]">
                  {fmt(months.reduce((s, m) => s + m.income, 0))}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--color-red)]">
                  {fmt(months.reduce((s, m) => s + m.expense, 0))}
                </td>
                <td className={cn(
                  "px-5 py-3 text-right font-mono font-semibold",
                  months.reduce((s, m) => s + m.result, 0) >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]"
                )}>
                  {(() => {
                    const t = months.reduce((s, m) => s + m.result, 0);
                    return `${t >= 0 ? "+" : "−"}${fmt(Math.abs(t))}`;
                  })()}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

interface ReportsViewProps extends Props {
  initialPeriod?: number;
}

export function ReportsView({ data, initialPeriod = 6 }: ReportsViewProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const router = useRouter();

  function handlePeriodChange(v: number) {
    setPeriod(v);
    router.push(`/reports?months=${v}`);
  }

  const { months, categoryTotals, totalIncome, totalExpense, avgMonthlyResult, contextBreakdown } = data;

  const hasContextData = contextBreakdown.personal.income + contextBreakdown.personal.expense
    + contextBreakdown.professional.income + contextBreakdown.professional.expense > 0;

  const isEmpty = months.every(m => m.income === 0 && m.expense === 0);

  return (
    <div className="p-8 max-w-[960px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
            Análise
          </div>
          <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] mb-2 leading-tight">
            Relató<span className="text-[var(--color-cyan)]">rios</span>
          </h1>
          <p className="text-[var(--color-f3)] text-sm">
            Histórico e análise por período
          </p>
        </div>
        <PeriodSelector current={period} onChange={handlePeriodChange} />
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="text-[var(--color-f4)] text-[13px]">Nenhuma transação encontrada no período.</div>
          <div className="text-[var(--color-f4)] text-[11px]">Adicione transações para visualizar os relatórios.</div>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Total recebido", value: totalIncome, color: "var(--color-green)", prefix: "+" },
              { label: "Total gasto", value: totalExpense, color: "var(--color-red)", prefix: "−" },
              {
                label: "Resultado médio/mês",
                value: Math.abs(avgMonthlyResult),
                color: avgMonthlyResult >= 0 ? "var(--color-green)" : "var(--color-red)",
                prefix: avgMonthlyResult >= 0 ? "+" : "−",
              },
            ].map(({ label, value, color, prefix }) => (
              <div key={label} className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] px-5 py-4">
                <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-2">{label}</div>
                <div
                  className="font-[family-name:var(--font-display)] italic text-[24px] font-bold tracking-tight"
                  style={{ color }}
                >
                  {prefix}{fmt(value)}
                </div>
              </div>
            ))}
          </div>

          {/* Trend chart */}
          <div className="relative mb-5">
            <TrendChart months={months} />
          </div>

          {/* Category breakdown */}
          {categoryTotals.length > 0 && (
            <div className="mb-5">
              <CategoryBreakdown categoryTotals={categoryTotals} months={months.length} />
            </div>
          )}

          {/* Context breakdown */}
          {hasContextData && (
            <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] p-5 mb-5">
              <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-4">
                Por contexto
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: "personal",     label: "Pessoal",      color: "var(--color-cyan)" },
                  { key: "professional", label: "Profissional", color: "var(--color-green)" },
                ] as const).map(({ key, label, color }) => {
                  const d = contextBreakdown[key];
                  const result = d.income - d.expense;
                  if (d.income === 0 && d.expense === 0) return null;
                  return (
                    <div key={key} className="bg-[var(--color-bg3)] border border-[var(--color-border)] rounded-[10px] p-4">
                      <div className="text-[11px] font-semibold mb-3" style={{ color }}>{label}</div>
                      <div className="flex flex-col gap-1.5">
                        {d.income > 0 && (
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[var(--color-f4)]">Receita</span>
                            <span className="text-[var(--color-green)] font-medium">+{fmt(d.income)}</span>
                          </div>
                        )}
                        {d.expense > 0 && (
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[var(--color-f4)]">Despesa</span>
                            <span className="text-[var(--color-red)] font-medium">−{fmt(d.expense)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[11px] pt-1.5 border-t border-[var(--color-border)]">
                          <span className="text-[var(--color-f3)] font-medium">Resultado</span>
                          <span className={cn("font-semibold", result >= 0 ? "text-[var(--color-green)]" : "text-[var(--color-red)]")}>
                            {result >= 0 ? "+" : "−"}{fmt(Math.abs(result))}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Table */}
          <MonthTable months={months} />
        </>
      )}
    </div>
  );
}

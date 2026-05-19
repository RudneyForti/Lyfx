"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface MonthData {
  label: string;
  expense: number;
  income: number;
  isCurrent: boolean;
}

interface Props {
  months: MonthData[];
}

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export function MonthlyTrendChart({ months }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVal = Math.max(...months.map((m) => Math.max(m.income, m.expense)), 1);

  return (
    <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[14px] p-5">
      <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-5">
        Gastos mensais
      </div>

      <div className="flex items-end gap-2" style={{ height: 100 }}>
        {months.map((m, i) => {
          const expH = Math.max(4, Math.round((m.expense / maxVal) * 88));
          const isHov = hovered === i;

          return (
            <div
              key={m.label}
              className="relative flex-1 flex flex-col items-center gap-1 cursor-default"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {isHov && (
                <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-20 bg-[var(--color-bg4)] border border-[var(--color-border2)] rounded-[8px] px-3 py-2 text-[11px] shadow-xl pointer-events-none whitespace-nowrap">
                  <div className="font-semibold text-[var(--color-f1)] mb-1">{m.label}</div>
                  <div className="text-[var(--color-green)]">+ {fmt(m.income)}</div>
                  <div className="text-[var(--color-red)]">− {fmt(m.expense)}</div>
                </div>
              )}

              {/* Bar */}
              <div className="w-full flex items-end justify-center" style={{ height: 88 }}>
                <div
                  className="w-full rounded-t-[4px] transition-all duration-150"
                  style={{
                    height: expH,
                    background: m.isCurrent
                      ? "var(--color-cyan)"
                      : isHov
                      ? "var(--color-bg5)"
                      : "var(--color-bg4)",
                    opacity: m.isCurrent ? 1 : isHov ? 1 : 0.7,
                  }}
                />
              </div>

              {/* Label */}
              <div className={cn(
                "text-[9px] whitespace-nowrap",
                m.isCurrent ? "text-[var(--color-cyan)]" : "text-[var(--color-f4)]"
              )}>
                {m.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { IconHome2, IconAlertTriangle, IconCircleCheck, IconArrowRight } from "@tabler/icons-react";

interface Props {
  totalAssets: number;
  totalCurrentValue: number;
  totalAnnualCost: number;
  pendingExpenses: number;
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function AssetsMiniWidget({ totalAssets, totalCurrentValue, totalAnnualCost, pendingExpenses }: Props) {
  if (totalAssets === 0) return null;

  return (
    <Link href="/assets" className="block group">
      <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] p-4 hover:border-[var(--color-border2)] transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[7px] bg-[var(--color-cyan-dim)] flex items-center justify-center text-[var(--color-cyan)]">
              <IconHome2 size={14} />
            </div>
            <span className="text-[12px] font-semibold text-[var(--color-f2)]">Bens e Imóveis</span>
          </div>
          <IconArrowRight size={13} className="text-[var(--color-f4)] group-hover:text-[var(--color-cyan)] transition-colors" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className="text-[10px] text-[var(--color-f4)] mb-0.5">Bens</div>
            <div className="text-[16px] font-bold text-[var(--color-cyan)]">{totalAssets}</div>
          </div>
          <div>
            <div className="text-[10px] text-[var(--color-f4)] mb-0.5">Valor total</div>
            <div className="text-[13px] font-semibold text-[var(--color-f1)]">{fmt(totalCurrentValue)}</div>
          </div>
          <div>
            <div className="text-[10px] text-[var(--color-f4)] mb-0.5">Custo/ano</div>
            <div className="text-[13px] font-semibold text-[var(--color-f1)]">{fmt(totalAnnualCost)}</div>
          </div>
        </div>

        {pendingExpenses > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--color-red)]">
            <IconAlertTriangle size={12} />
            {pendingExpenses} despesa{pendingExpenses > 1 ? "s" : ""} pendente{pendingExpenses > 1 ? "s" : ""}
          </div>
        )}
        {pendingExpenses === 0 && totalAnnualCost > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--color-green)]">
            <IconCircleCheck size={12} />
            Todas as despesas em dia
          </div>
        )}
      </div>
    </Link>
  );
}

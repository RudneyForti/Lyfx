import { DRESummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  summary: DRESummary;
}

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function Row({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between py-2 border-b border-[var(--color-border)] last:border-0 text-[12px]", muted && "opacity-60")}>
      <span className="text-[var(--color-f3)]">{label}</span>
      <span className="text-[var(--color-f1)] font-medium font-mono text-[11px]">{fmt(value)}</span>
    </div>
  );
}

export function DRE({ summary }: Props) {
  const positive = summary.result >= 0;

  return (
    <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] overflow-hidden">
      {/* Receitas */}
      <div className="px-5 py-4 border-b border-[var(--color-border)]">
        <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-3">
          Receitas
        </div>
        <Row label="Fixas" value={summary.credits.fixed} />
        <Row label="Variáveis" value={summary.credits.variable} />
        <div className="flex items-baseline justify-between pt-3 text-[12px]">
          <span className="text-[var(--color-f2)] font-semibold">Total receitas</span>
          <span className="text-[var(--color-green)] font-medium font-mono text-[13px]">{fmt(summary.credits.total)}</span>
        </div>
      </div>

      {/* Despesas */}
      <div className="px-5 py-4 border-b border-[var(--color-border)]">
        <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-3">
          Despesas
        </div>
        <Row label="Fixas" value={summary.debits.fixed} />
        <Row label="Variáveis" value={summary.debits.variable} />
        <Row label="Comprometido" value={summary.debits.committed} />
        <Row label="Longo Prazo" value={summary.debits.longterm} />
        <Row label="Sazonal" value={summary.debits.seasonal} />
        <Row label="Imprevisível" value={summary.debits.unexpected} />
        <Row label="Alocação Intencional" value={summary.debits.intentional} />
        <div className="flex items-baseline justify-between pt-3 text-[12px]">
          <span className="text-[var(--color-f2)] font-semibold">Total despesas</span>
          <span className="text-[var(--color-red)] font-medium font-mono text-[13px]">{fmt(summary.debits.total)}</span>
        </div>
      </div>

      {/* Resultado */}
      <div className={cn(
        "px-5 py-5 flex items-center justify-between",
        positive ? "bg-[var(--color-green-dim)]" : "bg-[var(--color-red-dim)]"
      )}>
        <div>
          <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-1">
            Resultado do mês
          </div>
          <div className={cn("text-[11px] font-medium", positive ? "text-[var(--color-green)]" : "text-[var(--color-red)]")}>
            {positive ? "Você está no positivo" : "Você está no negativo"}
          </div>
        </div>
        <div className={cn(
          "font-[family-name:var(--font-display)] italic text-[32px] font-bold tracking-tight",
          positive ? "text-[var(--color-green)]" : "text-[var(--color-red)]"
        )}>
          {positive ? "+" : "−"}{fmt(Math.abs(summary.result))}
        </div>
      </div>
    </div>
  );
}

import { DRESummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  summary: DRESummary;
}

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function MarginBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={cn(
      "text-[10px] font-medium font-mono px-2 py-0.5 rounded-full",
      positive
        ? "bg-[var(--color-green-dim)] text-[var(--color-green)] border border-[var(--color-green-border)]"
        : "bg-[var(--color-red-dim)] text-[var(--color-red)] border border-[var(--color-red-border)]"
    )}>
      {positive ? "+" : "−"}{fmt(Math.abs(value))}
    </span>
  );
}

function DebitRow({
  label,
  value,
  margin,
  marginLabel,
  muted,
}: {
  label: string;
  value: number;
  margin?: number;
  marginLabel?: string;
  muted?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2 py-2 border-b border-[var(--color-border)] last:border-0", muted && "opacity-50")}>
      <span className="text-[12px] text-[var(--color-f3)] flex-1">{label}</span>
      {value > 0 ? (
        <span className="text-[11px] font-mono text-[var(--color-red)]">−{fmt(value)}</span>
      ) : (
        <span className="text-[11px] font-mono text-[var(--color-f4)]">{fmt(0)}</span>
      )}
      {margin !== undefined && marginLabel && (
        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-[9px] text-[var(--color-f4)]">{marginLabel}</span>
          <MarginBadge value={margin} />
        </div>
      )}
    </div>
  );
}

export function DRE({ summary }: Props) {
  const { credits, debits, margins, result } = summary;
  const positive = result >= 0;

  return (
    <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[14px] overflow-hidden">

      {/* Receitas */}
      <div className="px-5 pt-5 pb-4 border-b border-[var(--color-border)]">
        <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-3">Receitas</div>
        <div className="flex items-baseline justify-between py-2 border-b border-[var(--color-border)] text-[12px]">
          <span className="text-[var(--color-f3)]">Receita fixa</span>
          <span className="font-mono text-[11px] text-[var(--color-green)]">+{fmt(credits.fixed)}</span>
        </div>
        <div className="flex items-baseline justify-between py-2 text-[12px]">
          <span className="text-[var(--color-f3)]">Receita variável</span>
          <span className="font-mono text-[11px] text-[var(--color-green)]">+{fmt(credits.variable)}</span>
        </div>
        <div className="flex items-baseline justify-between pt-3 mt-1 border-t border-[var(--color-border)]">
          <span className="text-[12px] font-semibold text-[var(--color-f2)]">Total disponível</span>
          <span className={cn(
            "font-[family-name:var(--font-display)] italic text-[20px] font-bold",
            "text-[var(--color-green)]"
          )}>
            {fmt(credits.total)}
          </span>
        </div>
      </div>

      {/* Despesas em cascata */}
      <div className="px-5 py-4 border-b border-[var(--color-border)]">
        <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-3">Despesas</div>

        <DebitRow
          label="Despesas fixas"
          value={debits.fixed}
          margin={margins.afterFixed}
          marginLabel="Sobra após fixos"
        />
        <DebitRow
          label="Despesas variáveis"
          value={debits.variable}
          margin={margins.afterVariable}
          marginLabel="Margem operacional"
        />
        <DebitRow
          label="Comprometido (parcelas)"
          value={debits.committed}
          margin={margins.afterCommitted}
          marginLabel="Resultado operacional"
        />
        <DebitRow label="Longo prazo (poupança)" value={debits.longterm} />
        <DebitRow label="Sazonal" value={debits.seasonal} muted={debits.seasonal === 0} />
        <DebitRow label="Imprevisível" value={debits.unexpected} muted={debits.unexpected === 0} />
        <DebitRow label="Alocação intencional" value={debits.intentional} muted={debits.intentional === 0} />

        <div className="flex items-baseline justify-between pt-3 mt-1 border-t border-[var(--color-border)]">
          <span className="text-[12px] font-semibold text-[var(--color-f2)]">Total despesas</span>
          <span className="font-mono text-[13px] font-semibold text-[var(--color-red)]">−{fmt(debits.total)}</span>
        </div>
      </div>

      {/* Resultado */}
      <div className={cn(
        "px-5 py-5 flex items-center justify-between",
        positive ? "bg-[var(--color-green-dim)]" : "bg-[var(--color-red-dim)]"
      )}>
        <div>
          <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-1">
            Resultado líquido
          </div>
          <div className={cn("text-[11px] font-medium", positive ? "text-[var(--color-green)]" : "text-[var(--color-red)]")}>
            {positive ? "Mês no positivo — você avançou" : "Mês no negativo — revise os gastos"}
          </div>
        </div>
        <div className={cn(
          "font-[family-name:var(--font-display)] italic text-[32px] font-bold tracking-tight",
          positive ? "text-[var(--color-green)]" : "text-[var(--color-red)]"
        )}>
          {positive ? "+" : "−"}{fmt(Math.abs(result))}
        </div>
      </div>
    </div>
  );
}

import { DRESummary } from "@/lib/types";
import { cn } from "@/lib/utils";

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

interface Props {
  summary: DRESummary;
}

export function KPICards({ summary }: Props) {
  const positive = summary.result >= 0;

  const cards = [
    {
      label: "Saldo",
      value: summary.result,
      formatted: `${positive ? "+" : "−"}${fmt(Math.abs(summary.result))}`,
      color: positive ? "var(--color-green)" : "var(--color-red)",
      dimColor: positive ? "var(--color-green-dim)" : "var(--color-red-dim)",
      borderColor: positive ? "var(--color-green-border)" : "var(--color-red-border)",
    },
    {
      label: "Receita",
      value: summary.credits.total,
      formatted: fmt(summary.credits.total),
      color: "var(--color-green)",
      dimColor: "var(--color-green-dim)",
      borderColor: "var(--color-green-border)",
    },
    {
      label: "Gastos",
      value: summary.debits.total,
      formatted: fmt(summary.debits.total),
      color: "var(--color-red)",
      dimColor: "var(--color-red-dim)",
      borderColor: "var(--color-red-border)",
    },
    {
      label: "Poupado",
      value: summary.saved,
      formatted: fmt(summary.saved),
      color: "var(--color-cyan)",
      dimColor: "var(--color-cyan-dim)",
      borderColor: "var(--color-cyan-border)",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[12px] px-4 py-3.5 border"
          style={{
            background: card.dimColor,
            borderColor: card.borderColor,
          }}
        >
          <div className="text-[9px] font-bold tracking-[1.8px] uppercase mb-2"
            style={{ color: "var(--color-f4)" }}>
            {card.label}
          </div>
          <div
            className="font-[family-name:var(--font-display)] italic text-[22px] font-bold tracking-tight leading-none"
            style={{ color: card.color }}
          >
            {card.formatted}
          </div>
        </div>
      ))}
    </div>
  );
}

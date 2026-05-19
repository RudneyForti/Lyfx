import {
  IconArrowUpRight,
  IconArrowDownRight,
  IconRepeat,
  IconCalendarDue,
  IconTag,
} from "@tabler/icons-react";
import { Transaction, TransactionCategory, Tag } from "@/lib/types";
import { getCategoryDef } from "@/lib/categories";
import { getTagIcon } from "@/lib/tag-icons";
import { cn } from "@/lib/utils";

interface Props {
  allTransactions: Transaction[];
}

const MONTHS_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MONTHS_FULL  = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtCompact(v: number) {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return `R$${v.toFixed(0)}`;
}

function TxRow({ tx }: { tx: Transaction }) {
  const cat = getCategoryDef(tx.category as TransactionCategory);
  const isCredit = tx.type === "credit";
  const tags = tx.tags ?? [];

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--color-border)] last:border-0">
      <div className={cn(
        "w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 border",
        isCredit
          ? "bg-[var(--color-green-dim)] border-[var(--color-green-border)] text-[var(--color-green)]"
          : "bg-[var(--color-red-dim)] border-[var(--color-red-border)] text-[var(--color-red)]"
      )}>
        {isCredit ? <IconArrowUpRight size={15} /> : <IconArrowDownRight size={15} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-medium text-[var(--color-f1)] truncate">{tx.description}</span>
          {tags.map((tag) => {
            const Icon = getTagIcon(tag.icon);
            return (
              <span
                key={tag.id}
                className="flex items-center gap-0.5 px-1.5 py-px rounded-full text-[9px] font-medium border flex-shrink-0"
                style={{ color: tag.color, borderColor: `${tag.color}44`, backgroundColor: `${tag.color}12` }}
              >
                <Icon size={8} />{tag.name}
              </span>
            );
          })}
        </div>
        <div className="text-[10px] text-[var(--color-f4)] mt-0.5">{cat.label}</div>
      </div>

      <div className="flex flex-col items-end flex-shrink-0">
        <span className={cn("text-[13px] font-medium", isCredit ? "text-[var(--color-green)]" : "text-[var(--color-red)]")}>
          {isCredit ? "+" : "−"}{fmt(tx.amount)}
        </span>
        {tx.recurrence === "yearly" && (
          <span className="text-[10px] text-[var(--color-f4)]">{fmt(tx.amount / 12)}/mês</span>
        )}
      </div>
    </div>
  );
}

export function FixedExpensesView({ allTransactions }: Props) {
  const today = new Date();

  const recurring = allTransactions.filter((t) => t.recurrence !== "once");
  const monthlies = recurring.filter((t) => t.recurrence === "monthly");
  const annuals   = recurring.filter((t) => t.recurrence === "yearly");

  // Debit totals
  const monthlyDebitTotal      = monthlies.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
  const annualDebitMonthly     = annuals.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount / 12, 0);
  const totalCommittedPerMonth = monthlyDebitTotal + annualDebitMonthly;

  // Tag breakdown (debits only, annual as monthly equivalent)
  const tagMap = new Map<string, { tag: Tag; total: number; count: number }>();
  for (const tx of [...monthlies, ...annuals]) {
    if (tx.type !== "debit") continue;
    const monthly = tx.recurrence === "yearly" ? tx.amount / 12 : tx.amount;
    for (const tag of tx.tags ?? []) {
      const entry = tagMap.get(tag.id) ?? { tag, total: 0, count: 0 };
      tagMap.set(tag.id, { ...entry, total: entry.total + monthly, count: entry.count + 1 });
    }
  }
  const tagBreakdown = [...tagMap.values()].sort((a, b) => b.total - a.total);

  // Year projection — next 12 months
  const projection = Array.from({ length: 12 }, (_, i) => {
    const date  = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const month = date.getMonth();
    const year  = date.getFullYear();
    const monthlyTotal = monthlies.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const annualHits   = annuals.filter((t) => t.type === "debit" && new Date(t.date).getMonth() === month);
    const annualTotal  = annualHits.reduce((s, t) => s + t.amount, 0);
    return { date, month, year, monthlyTotal, annualTotal, annualHits, total: monthlyTotal + annualTotal };
  });
  const projMax = Math.max(...projection.map((p) => p.total), 1);

  const hasData = recurring.length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center text-center py-20 bg-[var(--color-bg2)] border border-dashed border-[var(--color-border2)] rounded-[14px]">
        <IconCalendarDue size={40} className="text-[var(--color-f4)] mb-4" />
        <div className="text-[14px] font-medium text-[var(--color-f2)] mb-2">Nenhuma conta fixa registrada</div>
        <div className="text-[12px] text-[var(--color-f4)] max-w-xs">
          Ao cadastrar uma transação com recorrência "Todo mês" ou "Todo ano", ela aparecerá aqui.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Comprometido / mês", value: fmt(totalCommittedPerMonth), sub: "despesas fixas + rateio anuais", color: "text-[var(--color-f1)]" },
          { label: "Só mensais", value: fmt(monthlyDebitTotal), sub: `${monthlies.filter(t => t.type === "debit").length} item${monthlies.filter(t => t.type === "debit").length !== 1 ? "s" : ""}`, color: "text-[var(--color-red)]" },
          { label: "Anuais rateadas", value: fmt(annualDebitMonthly), sub: `${annuals.filter(t => t.type === "debit").length} item${annuals.filter(t => t.type === "debit").length !== 1 ? "s" : ""} ÷ 12`, color: "text-[var(--color-f2)]" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] px-5 py-4">
            <div className="text-[9px] uppercase tracking-[1.5px] text-[var(--color-f4)] mb-2">{label}</div>
            <div className={cn("text-[22px] font-bold font-[family-name:var(--font-display)] italic", color)}>{value}</div>
            <div className="text-[10px] text-[var(--color-f4)] mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Tag breakdown */}
      {tagBreakdown.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] flex items-center gap-2">
            <IconTag size={10} />
            Por tag
          </div>
          <div className="flex flex-wrap gap-2">
            {tagBreakdown.map(({ tag, total, count }) => {
              const Icon = getTagIcon(tag.icon);
              return (
                <div
                  key={tag.id}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] border"
                  style={{ borderColor: `${tag.color}33`, backgroundColor: `${tag.color}0d` }}
                >
                  <div
                    className="w-7 h-7 rounded-[7px] flex items-center justify-center border flex-shrink-0"
                    style={{ color: tag.color, borderColor: `${tag.color}44`, backgroundColor: `${tag.color}1a` }}
                  >
                    <Icon size={14} />
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold" style={{ color: tag.color }}>{tag.name}</div>
                    <div className="text-[10px] text-[var(--color-f4)]">{fmt(total)}/mês · {count} item{count !== 1 ? "s" : ""}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mensais */}
      {monthlies.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">
              Mensais
            </div>
            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[var(--color-cyan-dim)] text-[var(--color-cyan)] border border-[var(--color-cyan-border)]">
              <IconRepeat size={9} />{monthlies.length}
            </span>
          </div>
          <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] px-5">
            {monthlies.map((tx) => <TxRow key={tx.id} tx={tx} />)}
          </div>
        </div>
      )}

      {/* Anuais */}
      {annuals.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">
              Anuais
            </div>
            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[var(--color-cyan-dim)] text-[var(--color-cyan)] border border-[var(--color-cyan-border)]">
              <IconRepeat size={9} />{annuals.length}
            </span>
          </div>
          <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] px-5">
            {annuals.map((tx) => {
              const txMonth = new Date(tx.date).getMonth();
              return (
                <div key={tx.id} className="border-b border-[var(--color-border)] last:border-0">
                  <div className="flex items-center gap-2 py-1.5">
                    <span className="text-[9px] px-2 py-0.5 rounded-[4px] bg-[var(--color-bg3)] text-[var(--color-f4)] border border-[var(--color-border)] flex-shrink-0">
                      {MONTHS_SHORT[txMonth]}
                    </span>
                  </div>
                  <TxRow tx={tx} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Year projection */}
      <div className="flex flex-col gap-3">
        <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">
          Projeção — próximos 12 meses
        </div>
        <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] overflow-hidden">
          {projection.map(({ date, month, year, monthlyTotal, annualTotal, annualHits, total }, i) => {
            const isCurrentMonth = date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
            const barPct = (total / projMax) * 100;
            const hasAnnual = annualTotal > 0;

            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-4 px-5 py-3 border-b border-[var(--color-border)] last:border-0",
                  isCurrentMonth && "bg-[var(--color-cyan-faint)]"
                )}
              >
                {/* Month label */}
                <div className="w-16 flex-shrink-0">
                  <div className={cn("text-[12px] font-medium", isCurrentMonth ? "text-[var(--color-cyan)]" : "text-[var(--color-f2)]")}>
                    {MONTHS_SHORT[month]}
                  </div>
                  <div className="text-[9px] text-[var(--color-f4)]">{year}</div>
                </div>

                {/* Bar */}
                <div className="flex-1 flex flex-col gap-1">
                  <div className="h-2 bg-[var(--color-bg4)] rounded-full overflow-hidden flex">
                    {monthlyTotal > 0 && (
                      <div
                        className="h-full bg-[var(--color-red)] opacity-60 rounded-full"
                        style={{ width: `${(monthlyTotal / projMax) * 100}%` }}
                      />
                    )}
                    {hasAnnual && (
                      <div
                        className="h-full bg-[#FBBF24] rounded-full -ml-1"
                        style={{ width: `${(annualTotal / projMax) * 100}%` }}
                      />
                    )}
                  </div>
                  {hasAnnual && (
                    <div className="text-[9px] text-[#FBBF24]">
                      + {annualHits.map((t) => t.description).join(", ")}
                    </div>
                  )}
                </div>

                {/* Value */}
                <div className="w-24 text-right flex-shrink-0">
                  <div className={cn("text-[12px] font-medium", hasAnnual ? "text-[#FBBF24]" : "text-[var(--color-f2)]")}>
                    {fmtCompact(total)}
                  </div>
                  {hasAnnual && (
                    <div className="text-[9px] text-[var(--color-f4)]">base {fmtCompact(monthlyTotal)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm bg-[var(--color-red)] opacity-60" />
            <span className="text-[10px] text-[var(--color-f4)]">Mensais</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm bg-[#FBBF24]" />
            <span className="text-[10px] text-[var(--color-f4)]">Anuais (meses de vencimento)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

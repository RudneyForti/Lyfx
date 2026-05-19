import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";
import { getDRESummary, getTransactions } from "@/app/actions/transactions";
import { DRE } from "@/components/dashboard/DRE";
import { TransactionList } from "@/components/transactions/TransactionList";
import { Transaction, TransactionCategory } from "@/lib/types";

export default async function DashboardPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [summary, transactions] = await Promise.all([
    getDRESummary(month, year),
    getTransactions({ month, year }),
  ]);

  const monthName = now.toLocaleDateString("pt-BR", { month: "long" });

  return (
    <div className="p-14 max-w-[1040px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2.5 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
            Centro de comando
          </div>
          <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] leading-tight">
            <span className="text-[var(--color-cyan)] capitalize">{monthName}</span> {year}
          </h1>
          <p className="text-[var(--color-f3)] text-sm mt-2">
            Seu DRE pessoal. Tudo que entrou e tudo que saiu.
          </p>
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-[13px] font-medium bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(34,211,238,0.25)] no-underline"
        >
          <IconPlus size={15} />
          Nova transação
        </Link>
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-8 items-start">
        {/* DRE */}
        <DRE summary={summary} />

        {/* Últimas transações */}
        <div>
          <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-3">
            Últimas transações
          </div>
          <TransactionList transactions={transactions.slice(0, 8) as Transaction[]} />
          {transactions.length > 8 && (
            <Link href="/transactions" className="text-[11px] text-[var(--color-cyan)] mt-3 block hover:underline">
              Ver todas ({transactions.length})
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

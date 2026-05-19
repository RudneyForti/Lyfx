import Link from "next/link";
import { IconPlus } from "@tabler/icons-react";
import { getDashboardData } from "@/app/actions/dashboard";
import { DRE } from "@/components/dashboard/DRE";
import { KPICards } from "@/components/dashboard/KPICards";
import { InsightBanner } from "@/components/dashboard/InsightBanner";
import { GoalsMiniWidget } from "@/components/dashboard/GoalsMiniWidget";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard";
import { TransactionList } from "@/components/transactions/TransactionList";
import { Transaction } from "@/lib/types";

export default async function DashboardPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  const { summary, transactions, goals, trend, allTags, healthScore } = await getDashboardData(month, year);

  const monthName = now.toLocaleDateString("pt-BR", { month: "long" });

  const mappedTx: Transaction[] = transactions.map((tx) => ({
    ...tx,
    type: tx.type as Transaction["type"],
    category: tx.category as Transaction["category"],
    recurrence: tx.recurrence as Transaction["recurrence"],
    tags: tx.tags?.map((tt) => tt.tag) ?? [],
  }));

  return (
    <div className="p-8 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
            Centro de comando
          </div>
          <h1 className="font-[family-name:var(--font-display)] italic text-[32px] font-bold tracking-tight text-[var(--color-f1)] leading-tight">
            Dashboard
          </h1>
          <p className="text-[var(--color-f3)] text-[13px] mt-1 capitalize">
            {monthName} {year}
          </p>
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-[13px] font-medium bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(34,211,238,0.25)] no-underline"
        >
          <IconPlus size={15} />
          Nova transação
        </Link>
      </div>

      {/* KPI cards */}
      <KPICards summary={summary} />

      {/* Main grid */}
      <div className="grid grid-cols-[1fr_300px] gap-5 items-start">

        {/* Left: DRE + trend */}
        <div className="flex flex-col gap-5">
          <DRE summary={summary} />
          <MonthlyTrendChart months={trend} />
        </div>

        {/* Right: Goals + Insight + Transactions */}
        <div className="flex flex-col gap-4">
          <HealthScoreCard healthScore={healthScore} />
          <GoalsMiniWidget goals={goals} />
          <InsightBanner summary={summary} goals={goals} />

          {/* Recent transactions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">
                Últimas transações
              </div>
              {transactions.length > 0 && (
                <Link href="/transactions" className="text-[10px] text-[var(--color-cyan)] hover:underline no-underline">
                  Ver todas
                </Link>
              )}
            </div>
            <TransactionList transactions={mappedTx} allTags={allTags} />
          </div>
        </div>
      </div>
    </div>
  );
}

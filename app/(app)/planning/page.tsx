import { IconCalendarMonth, IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { MonthlyCalendar } from "@/components/planning/MonthlyCalendar";
import { Transaction } from "@/lib/types";

export default async function PlanningPage() {
  // Fetch all transactions (calendar navigates client-side, filters in component)
  const raw = await db.transaction.findMany({ orderBy: { date: "asc" } });
  const transactions = raw as unknown as Transaction[];

  return (
    <div className="p-14 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2.5 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
            Visão temporal
          </div>
          <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] leading-tight">
            Plano <span className="text-[var(--color-cyan)]">Mensal</span>
          </h1>
          <p className="text-[var(--color-f3)] text-sm mt-2 max-w-lg">
            Visualize créditos e débitos dia a dia. Clique em qualquer data para ver o detalhe das transações.
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

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center text-center py-20 bg-[var(--color-bg2)] border border-dashed border-[var(--color-border2)] rounded-[14px]">
          <IconCalendarMonth size={40} className="text-[var(--color-f4)] mb-4" />
          <div className="text-[14px] font-medium text-[var(--color-f2)] mb-2">Nenhuma transação registrada</div>
          <div className="text-[12px] text-[var(--color-f4)] max-w-xs mb-6">
            Registre créditos e débitos para visualizá-los no calendário.
          </div>
          <Link
            href="/transactions"
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[12px] font-medium bg-[var(--color-cyan-dim)] text-[var(--color-cyan)] border border-[var(--color-cyan-border)] hover:bg-[rgba(34,211,238,0.2)] transition-all no-underline"
          >
            <IconPlus size={13} />
            Registrar primeira transação
          </Link>
        </div>
      ) : (
        <MonthlyCalendar transactions={transactions} />
      )}
    </div>
  );
}

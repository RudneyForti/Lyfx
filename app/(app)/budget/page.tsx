import { getBudgets } from "@/app/actions/budgets";
import { getTransactions } from "@/app/actions/transactions";
import { BudgetView } from "@/components/budget/BudgetView";

export default async function BudgetPage() {
  const [budgets, allTransactions] = await Promise.all([
    getBudgets(),
    getTransactions(), // all transactions, month filtered client-side
  ]);

  return (
    <div className="p-14 max-w-[760px]">
      <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2.5 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
        Controle de gastos
      </div>
      <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] mb-2 leading-tight">
        Orça<span className="text-[var(--color-cyan)]">mento</span>
      </h1>
      <p className="text-[var(--color-f3)] text-sm mb-10">
        Defina limites por categoria e acompanhe quanto já foi gasto em cada mês.
      </p>

      <BudgetView initialBudgets={budgets} allTransactions={allTransactions} />
    </div>
  );
}

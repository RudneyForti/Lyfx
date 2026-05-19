import { getBudgets } from "@/app/actions/budgets";
import { getTransactions } from "@/app/actions/transactions";
import { getSettings } from "@/app/actions/settings";
import { BudgetView } from "@/components/budget/BudgetView";

export default async function BudgetPage() {
  const [budgets, allTransactions, settings] = await Promise.all([
    getBudgets(),
    getTransactions(),
    getSettings(),
  ]);

  return (
    <div className="p-8 max-w-[860px]">
      <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2.5 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
        Controle de gastos
      </div>
      <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] mb-2 leading-tight">
        Orça<span className="text-[var(--color-cyan)]">mento</span>
      </h1>
      <p className="text-[var(--color-f3)] text-sm mb-10">
        Planeje sua receita esperada, aloque por categoria e compare com o que realmente aconteceu.
      </p>

      <BudgetView
        initialBudgets={budgets}
        allTransactions={allTransactions}
        initialExpectedIncome={settings.expectedMonthlyIncome}
      />
    </div>
  );
}

import { getTransactions } from "@/app/actions/transactions";
import { FixedExpensesView } from "@/components/fixed-expenses/FixedExpensesView";

export default async function FixedExpensesPage() {
  const allTransactions = await getTransactions();

  return (
    <div className="p-14 max-w-[860px]">
      <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2.5 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
        Compromissos recorrentes
      </div>
      <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] mb-2 leading-tight">
        Contas <span className="text-[var(--color-cyan)]">Fixas</span>
      </h1>
      <p className="text-[var(--color-f3)] text-sm mb-10">
        Tudo que se repete todo mês ou todo ano. O piso financeiro antes de qualquer decisão.
      </p>

      <FixedExpensesView allTransactions={allTransactions} />
    </div>
  );
}

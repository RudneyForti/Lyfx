import { getTransactions } from "@/app/actions/transactions";
import { getTags } from "@/app/actions/tags";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";

export default async function TransactionsPage() {
  const now = new Date();
  const [transactions, allTags] = await Promise.all([
    getTransactions({ month: now.getMonth() + 1, year: now.getFullYear() }),
    getTags(),
  ]);

  return (
    <div className="p-14 max-w-[1040px]">
      {/* Header */}
      <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2.5 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
        Entradas e saídas
      </div>
      <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] mb-2 leading-tight">
        Transa<span className="text-[var(--color-cyan)]">ções</span>
      </h1>
      <p className="text-[var(--color-f3)] text-sm mb-10">
        Registre créditos e débitos. Tudo que entra e tudo que sai.
      </p>

      <div className="grid grid-cols-[380px_1fr] gap-8 items-start">
        {/* Formulário */}
        <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] p-5 sticky top-8">
          <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-4">
            Nova transação
          </div>
          <TransactionForm allTags={allTags} />
        </div>

        {/* Lista */}
        <TransactionList transactions={transactions} allTags={allTags} />
      </div>
    </div>
  );
}

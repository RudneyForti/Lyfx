import { getTransactions } from "@/app/actions/transactions";
import { getTags } from "@/app/actions/tags";
import { getAccountsForSelect } from "@/app/actions/institutions";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionMonthNav } from "@/components/transactions/TransactionMonthNav";

interface Props {
  searchParams: Promise<{ month?: string }>;
}

export default async function TransactionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();

  // CS-06: lê o parâmetro ?month=YYYY-MM da URL; fallback para mês atual
  let year  = now.getFullYear();
  let month = now.getMonth() + 1;

  if (params.month && /^\d{4}-\d{2}$/.test(params.month)) {
    const [y, m] = params.month.split("-").map(Number);
    year  = y;
    month = m;
  }

  const currentMonthParam = `${year}-${String(month).padStart(2, "0")}`;

  const [transactions, allTags, accounts] = await Promise.all([
    getTransactions({ month, year }),
    getTags(),
    getAccountsForSelect(),
  ]);

  return (
    <div className="p-8 max-w-[1040px]">
      {/* Header */}
      <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2.5 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
        Entradas e saídas
      </div>
      <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] mb-2 leading-tight">
        Transa<span className="text-[var(--color-cyan)]">ções</span>
      </h1>

      {/* CS-06: navegação de período */}
      <TransactionMonthNav currentMonth={currentMonthParam} />

      <div className="grid grid-cols-[380px_1fr] gap-8 items-start mt-6">
        {/* Formulário */}
        <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] p-5 sticky top-8">
          <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-4">
            Nova transação
          </div>
          <TransactionForm allTags={allTags} accounts={accounts} />
        </div>

        {/* Lista */}
        <TransactionList transactions={transactions} allTags={allTags} />
      </div>
    </div>
  );
}

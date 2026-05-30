"use client";

import { useRouter } from "next/navigation";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

const MONTHS_FULL = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

interface Props {
  currentMonth: string; // "YYYY-MM"
}

export function TransactionMonthNav({ currentMonth }: Props) {
  const router = useRouter();
  const [year, month] = currentMonth.split("-").map(Number);

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  function navigate(delta: number) {
    let newMonth = month + delta;
    let newYear  = year;
    if (newMonth < 1)  { newMonth = 12; newYear -= 1; }
    if (newMonth > 12) { newMonth = 1;  newYear += 1; }
    const mm = String(newMonth).padStart(2, "0");
    router.push(`/transactions?month=${newYear}-${mm}`);
  }

  function goToToday() {
    router.push("/transactions");
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <button
        onClick={() => navigate(-1)}
        className="w-8 h-8 flex items-center justify-center rounded-[12px] border border-[var(--color-border2)] bg-[var(--color-bg3)] text-[var(--color-f3)] hover:text-[var(--color-f1)] hover:border-[var(--color-cyan-border)] transition-all cursor-pointer"
        aria-label="Mês anterior"
      >
        <IconChevronLeft size={14} />
      </button>

      <span className="text-[14px] font-semibold text-[var(--color-f1)] min-w-[160px] text-center">
        {MONTHS_FULL[month - 1]} de {year}
      </span>

      <button
        onClick={() => navigate(1)}
        className="w-8 h-8 flex items-center justify-center rounded-[12px] border border-[var(--color-border2)] bg-[var(--color-bg3)] text-[var(--color-f3)] hover:text-[var(--color-f1)] hover:border-[var(--color-cyan-border)] transition-all cursor-pointer"
        aria-label="Próximo mês"
      >
        <IconChevronRight size={14} />
      </button>

      {!isCurrentMonth && (
        <button
          onClick={goToToday}
          className="ml-1 px-3 py-1.5 rounded-[7px] text-[11px] font-medium border border-[var(--color-cyan-border)] bg-[var(--color-cyan-faint)] text-[var(--color-cyan)] hover:bg-[var(--color-cyan-dim)] transition-all cursor-pointer"
        >
          Mês atual
        </button>
      )}
    </div>
  );
}

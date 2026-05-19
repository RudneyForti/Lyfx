"use client";

import { useState, useTransition } from "react";
import { IconTrash, IconArrowUpRight, IconArrowDownRight, IconRepeat, IconPencil } from "@tabler/icons-react";
import { deleteTransaction } from "@/app/actions/transactions";
import { getCategoryDef } from "@/lib/categories";
import { Transaction, TransactionCategory, Tag } from "@/lib/types";
import { getTagIcon } from "@/lib/tag-icons";
import { EditTransactionModal } from "./EditTransactionModal";
import { cn } from "@/lib/utils";

interface Props {
  transactions: Transaction[];
  allTags: Tag[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(date));
}

function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => deleteTransaction(id))}
      disabled={isPending}
      className="w-7 h-7 rounded-[6px] bg-transparent border border-transparent flex items-center justify-center text-[var(--color-f4)] hover:bg-[var(--color-red-dim)] hover:border-[var(--color-red-border)] hover:text-[var(--color-red)] transition-all duration-150 cursor-pointer opacity-0 group-hover:opacity-100 disabled:opacity-30"
    >
      <IconTrash size={13} />
    </button>
  );
}

export function TransactionList({ transactions, allTags }: Props) {
  const [editing, setEditing] = useState<Transaction | null>(null);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center text-center p-9 bg-[var(--color-bg2)] border border-dashed border-[var(--color-border2)] rounded-[14px]">
        <div className="text-[36px] text-[var(--color-f4)] mb-3">∅</div>
        <div className="text-[14px] font-medium text-[var(--color-f2)] mb-1">Nenhuma transação</div>
        <div className="text-[12px] text-[var(--color-f4)] max-w-[220px]">
          Registre um crédito ou débito para começar a construir seu DRE.
        </div>
      </div>
    );
  }

  return (
    <>
      {editing && (
        <EditTransactionModal
          transaction={editing}
          allTags={allTags}
          onClose={() => setEditing(null)}
        />
      )}

      <div className="flex flex-col gap-1">
        <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-3">
          {transactions.length} transaç{transactions.length === 1 ? "ão" : "ões"} este mês
        </div>
        {transactions.map((tx) => {
          const cat = getCategoryDef(tx.category as TransactionCategory);
          const isCredit = tx.type === "credit";
          const tags = tx.tags ?? [];

          return (
            <div
              key={tx.id}
              className="group flex items-center gap-3 py-2.5 border-b border-[var(--color-border)] last:border-0"
            >
              {/* Ícone */}
              <div className={cn(
                "w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 border",
                isCredit
                  ? "bg-[var(--color-green-dim)] border-[var(--color-green-border)] text-[var(--color-green)]"
                  : "bg-[var(--color-red-dim)] border-[var(--color-red-border)] text-[var(--color-red)]"
              )}>
                {isCredit ? <IconArrowUpRight size={15} /> : <IconArrowDownRight size={15} />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-medium text-[var(--color-f1)] truncate">
                    {tx.description}
                  </span>
                  {tx.recurrence !== "once" && (
                    <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[var(--color-cyan-dim)] text-[var(--color-cyan)] border border-[var(--color-cyan-border)] flex-shrink-0">
                      <IconRepeat size={9} />
                      {tx.recurrence === "monthly" ? "Mensal" : "Anual"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-[10px] text-[var(--color-f4)]">
                    {cat.label} · {formatDate(tx.date)}
                  </span>
                  {tags.map((tag) => {
                    const Icon = getTagIcon(tag.icon);
                    return (
                      <span
                        key={tag.id}
                        className="flex items-center gap-0.5 px-1.5 py-px rounded-full text-[9px] font-medium border"
                        style={{
                          color: tag.color,
                          borderColor: `${tag.color}44`,
                          backgroundColor: `${tag.color}12`,
                        }}
                      >
                        <Icon size={8} />
                        {tag.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Valor */}
              <div className={cn(
                "text-[13px] font-medium flex-shrink-0",
                isCredit ? "text-[var(--color-green)]" : "text-[var(--color-red)]"
              )}>
                {isCredit ? "+" : "−"}{formatCurrency(tx.amount)}
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                  onClick={() => setEditing(tx)}
                  className="w-7 h-7 rounded-[6px] bg-transparent border border-transparent flex items-center justify-center text-[var(--color-f4)] hover:bg-[var(--color-cyan-dim)] hover:border-[var(--color-cyan-border)] hover:text-[var(--color-cyan)] transition-all duration-150 cursor-pointer"
                >
                  <IconPencil size={13} />
                </button>
                <DeleteButton id={tx.id} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

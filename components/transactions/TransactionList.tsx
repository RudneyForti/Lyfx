"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  IconArrowUpRight, IconArrowDownRight, IconRepeat,
  IconPencil, IconStack2, IconTrash, IconX,
  IconHome, IconBriefcase,
} from "@tabler/icons-react";
import { deleteTransaction, deleteInstallmentGroup } from "@/app/actions/transactions";
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
  // CS-41: timeZone:"UTC" garante consistência entre server (Docker UTC+0) e client (browser local)
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(date));
}

function ActionBar({
  tx,
  onEdit,
  onClose,
}: {
  tx: Transaction;
  onEdit: () => void;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  // CS-14: confirmação antes de excluir — "single" | "group" | null
  const [confirmMode, setConfirmMode] = useState<"single" | "group" | null>(null);
  const isInstallment = !!tx.installmentGroupId;

  if (confirmMode) {
    const isGroup = confirmMode === "group";
    const label = isGroup
      ? `Excluir todas as ${tx.installmentTotal}x parcelas? Esta ação não pode ser desfeita.`
      : "Deletar esta transação? Esta ação não pode ser desfeita.";

    return (
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[rgba(248,113,113,0.07)] border-b border-[var(--color-red-border)]">
        <span className="text-[10px] text-[var(--color-red)] flex-1 min-w-0 truncate">{label}</span>
        <button
          onClick={() => setConfirmMode(null)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-[5px] text-[10px] font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
          style={{ background: "rgba(255,255,255,0.05)", color: "var(--color-f2)", border: "1px solid var(--color-border2)" }}
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            startTransition(() => {
              if (isGroup) { deleteInstallmentGroup(tx.installmentGroupId!); }
              else { deleteTransaction(tx.id); }
              onClose();
            });
          }}
          disabled={isPending}
          className="flex items-center gap-1 px-2.5 py-1 rounded-[5px] text-[10px] font-medium whitespace-nowrap bg-[var(--color-red-dim)] text-[var(--color-red)] border border-[var(--color-red-border)] cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          <IconTrash size={10} /> Confirmar exclusão
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-[rgba(248,113,113,0.07)] border-b border-[var(--color-red-border)]">
      <button
        onClick={() => { onEdit(); onClose(); }}
        className="flex items-center gap-1 px-2.5 py-1 rounded-[5px] text-[10px] font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
        style={{ background: "rgba(251,191,36,0.1)", color: "#FFC107", border: "1px solid rgba(251,191,36,0.25)" }}
      >
        <IconPencil size={10} /> Editar
      </button>

      <button
        onClick={() => setConfirmMode("single")}
        disabled={isPending}
        className="flex items-center gap-1 px-2.5 py-1 rounded-[5px] text-[10px] font-medium whitespace-nowrap bg-[var(--color-red-dim)] text-[var(--color-red)] border border-[var(--color-red-border)] cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-40"
      >
        <IconTrash size={10} /> {isInstallment ? "Só esta" : "Excluir"}
      </button>

      {isInstallment && tx.installmentGroupId && tx.installmentTotal != null && (
        <button
          onClick={() => setConfirmMode("group")}
          disabled={isPending}
          className="flex items-center gap-1 px-2.5 py-1 rounded-[5px] text-[10px] font-medium whitespace-nowrap bg-[var(--color-red-dim)] text-[var(--color-red)] border border-[var(--color-red-border)] cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          <IconStack2 size={10} /> Excluir {tx.installmentTotal}x
        </button>
      )}

      <div className="flex-1" />

      <button
        onClick={onClose}
        className="w-5 h-5 flex items-center justify-center text-[var(--color-f4)] hover:text-[var(--color-f2)] cursor-pointer rounded-[4px] hover:bg-white/[0.06] transition-all flex-shrink-0"
      >
        <IconX size={12} />
      </button>
    </div>
  );
}

type ContextFilter = "all" | "personal" | "professional" | "none";

const CONTEXT_FILTERS: { value: ContextFilter; label: string; icon?: React.ElementType }[] = [
  { value: "all",          label: "Todos" },
  { value: "personal",     label: "Pessoal",      icon: IconHome },
  { value: "professional", label: "Profissional", icon: IconBriefcase },
  { value: "none",         label: "Sem contexto" },
];

export function TransactionList({ transactions, allTags }: Props) {
  const [editing, setEditing]   = useState<Transaction | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ctxFilter, setCtxFilter] = useState<ContextFilter>("all");
  // CS-14: ref para o container do item expandido (click-outside fecha o ActionBar)
  const expandedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (expandedRef.current && !expandedRef.current.contains(e.target as Node)) {
        setExpanded(null);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [expanded]);

  const hasContext = transactions.some(t => t.context);

  const filtered = transactions.filter(tx => {
    if (ctxFilter === "all")          return true;
    if (ctxFilter === "none")         return !tx.context;
    return tx.context === ctxFilter;
  });

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

      <div className="flex flex-col gap-1.5">
        {/* Context filter — only shown when at least one tx has context */}
        {hasContext && (
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {CONTEXT_FILTERS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setCtxFilter(value)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[10px] font-medium border transition-all cursor-pointer",
                  ctxFilter === value
                    ? "bg-[var(--color-cyan-faint)] border-[var(--color-cyan-border)] text-[var(--color-cyan)]"
                    : "bg-[var(--color-bg3)] border-[var(--color-border)] text-[var(--color-f4)] hover:text-[var(--color-f2)]"
                )}
              >
                {Icon && <Icon size={10} />}
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-2">
          {filtered.length} transaç{filtered.length === 1 ? "ão" : "ões"}{ctxFilter !== "all" ? " (filtradas)" : " este mês"}
        </div>

        {filtered.map((tx) => {
          const cat           = getCategoryDef(tx.category as TransactionCategory);
          const isCredit      = tx.type === "credit";
          const tags          = tx.tags ?? [];
          const isInstallment = !!tx.installmentGroupId;
          const isExpanded    = expanded === tx.id;

          return (
            <div
              key={tx.id}
              ref={isExpanded ? expandedRef : undefined}
              className={cn(
                "rounded-[10px] border overflow-hidden transition-all duration-200",
                isExpanded
                  ? "border-[var(--color-red-border)]"
                  : "border-[var(--color-border)] hover:border-[var(--color-border2)]"
              )}
            >
              {/* Action bar — slide down on expand */}
              <div className={cn(
                "overflow-hidden transition-[max-height] duration-200 ease-out",
                isExpanded ? "max-h-12" : "max-h-0"
              )}>
                <ActionBar
                  tx={tx}
                  onEdit={() => setEditing(tx)}
                  onClose={() => setExpanded(null)}
                />
              </div>

              {/* Row content */}
              <div
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer select-none"
                onClick={() => setExpanded(isExpanded ? null : tx.id)}
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
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] font-medium text-[var(--color-f1)] truncate flex-1 min-w-0">
                      {tx.description}
                    </span>
                    {tx.recurrence !== "once" && !isInstallment && (
                      <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[var(--color-cyan-dim)] text-[var(--color-cyan)] border border-[var(--color-cyan-border)] flex-shrink-0">
                        <IconRepeat size={9} />
                        {tx.recurrence === "monthly" ? "Mensal" : "Anual"}
                      </span>
                    )}
                    {isInstallment && tx.installmentNumber != null && tx.installmentTotal != null && (
                      <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-[4px] flex-shrink-0"
                        style={{ background: "rgba(251,191,36,0.08)", color: "#FFC107", border: "1px solid rgba(251,191,36,0.2)" }}>
                        <IconStack2 size={9} />
                        {tx.installmentNumber}/{tx.installmentTotal}
                      </span>
                    )}
                    {tx.context === "personal" && (
                      <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-[4px] flex-shrink-0 bg-[rgba(34,211,238,0.07)] text-[var(--color-cyan)] border border-[var(--color-cyan-border)]">
                        <IconHome size={9} /> Pessoal
                      </span>
                    )}
                    {tx.context === "professional" && (
                      <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-[4px] flex-shrink-0 bg-[rgba(163,230,53,0.07)] text-[var(--color-green)] border border-[rgba(163,230,53,0.2)]">
                        <IconBriefcase size={9} /> Profissional
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
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

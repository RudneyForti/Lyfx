"use client";

import { useState, useTransition } from "react";
import {
  IconX, IconCheck, IconCurrencyReal,
  IconRepeat, IconRepeatOff, IconStack2, IconInfoCircle,
} from "@tabler/icons-react";
import { updateTransaction, updateFutureInstallments } from "@/app/actions/transactions";
import { CREDIT_CATEGORIES, DEBIT_CATEGORIES } from "@/lib/categories";
import { Transaction, TransactionType, TransactionCategory, Recurrence, Tag } from "@/lib/types";
import { TagPicker } from "@/components/tags/TagPicker";
import { cn } from "@/lib/utils";

interface Props {
  transaction: Transaction;
  allTags: Tag[];
  onClose: () => void;
}

function stripInstallmentSuffix(desc: string) {
  return desc.replace(/\s*\(\d+\/\d+\)$/, "");
}

type Mode = "single" | "installment" | "recurring";

function ContextBanner({ mode, tx }: { mode: Mode; tx: Transaction }) {
  if (mode === "single") return null;

  const isInstallment = mode === "installment";
  const remaining = isInstallment && tx.installmentTotal && tx.installmentNumber
    ? tx.installmentTotal - tx.installmentNumber + 1
    : null;

  return (
    <div className="flex items-start gap-2 px-4 py-3 rounded-[8px] border text-[11px] leading-relaxed"
      style={{
        background: "rgba(251,191,36,0.06)",
        borderColor: "rgba(251,191,36,0.2)",
        color: "#FFC107",
      }}>
      <IconInfoCircle size={13} className="flex-shrink-0 mt-px" />
      {isInstallment
        ? `Apenas as parcelas a partir de hoje serão alteradas${remaining ? ` (${remaining} restante${remaining > 1 ? "s" : ""})` : ""}.`
        : "Esta alteração afeta as projeções futuras. O histórico já registrado não é modificado."}
    </div>
  );
}

export function EditTransactionModal({ transaction, allTags, onClose }: Props) {
  const [isPending, startTransition] = useTransition();

  const mode: Mode = transaction.installmentGroupId
    ? "installment"
    : transaction.recurrence !== "once"
    ? "recurring"
    : "single";

  const [type, setType] = useState<TransactionType>(transaction.type);
  const [form, setForm] = useState({
    date:        new Date(transaction.date).toISOString().split("T")[0],
    description: mode === "installment"
      ? stripInstallmentSuffix(transaction.description)
      : transaction.description,
    amount:      String(transaction.amount),
    category:    transaction.category as TransactionCategory,
    notes:       transaction.notes ?? "",
    recurrence:  (transaction.recurrence ?? "once") as Recurrence,
  });
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    transaction.tags?.map((t) => t.id) ?? []
  );
  const [error, setError] = useState("");

  const categories = type === "credit" ? CREDIT_CATEGORIES : DEBIT_CATEGORIES;

  function handleTypeChange(t: TransactionType) {
    setType(t);
    setForm((f) => ({ ...f, category: "" as TransactionCategory }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.description.trim()) return setError("Descrição obrigatória.");
    if (!form.amount || Number(form.amount) <= 0) return setError("Valor inválido.");
    if (!form.category) return setError("Selecione uma categoria.");

    if (mode === "installment") {
      startTransition(async () => {
        await updateFutureInstallments(transaction.installmentGroupId!, {
          baseDescription: form.description.trim(),
          amount: Number(form.amount),
          type,
          category: form.category,
          notes: form.notes.trim() || undefined,
          tagIds: selectedTagIds,
        });
        onClose();
      });
    } else {
      startTransition(async () => {
        await updateTransaction(transaction.id, {
          date:        form.date,
          description: form.description.trim(),
          amount:      Number(form.amount),
          type,
          category:    form.category,
          notes:       form.notes.trim() || undefined,
          recurrence:  form.recurrence,
          tagIds:      selectedTagIds,
        });
        onClose();
      });
    }
  }

  const titleMap: Record<Mode, string> = {
    single:      "Editar transação",
    installment: "Editar parcelamento",
    recurring:   "Editar recorrência",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--color-bg2)] border border-[var(--color-border2)] rounded-[18px] w-full max-w-[480px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.6)] mx-4 max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] flex-shrink-0">
          <div className="flex items-center gap-2">
            {mode === "installment" && <IconStack2 size={14} style={{ color: "#FFC107" }} />}
            {mode === "recurring"   && <IconRepeat  size={14} style={{ color: "#FFC107" }} />}
            <span className="text-[15px] font-semibold text-[var(--color-f1)]">
              {titleMap[mode]}
            </span>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-[6px] bg-[var(--color-bg4)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-f3)] hover:bg-[var(--color-bg5)] hover:text-[var(--color-f1)] transition-all cursor-pointer">
            <IconX size={14} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto">

          <ContextBanner mode={mode} tx={transaction} />

          {/* Tipo */}
          <div className="flex gap-2 bg-[var(--color-bg3)] p-[3px] rounded-[10px]">
            {(["credit", "debit"] as const).map((t) => (
              <button key={t} type="button" onClick={() => handleTypeChange(t)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-[6px] text-[12px] text-center cursor-pointer transition-all duration-150",
                  type === t
                    ? "bg-[var(--color-bg2)] text-[var(--color-f1)] font-medium border border-[var(--color-border2)]"
                    : "text-[var(--color-f4)] hover:text-[var(--color-f2)]"
                )}>
                {t === "credit" ? "Crédito" : "Débito"}
              </button>
            ))}
          </div>

          {/* Data + Valor */}
          <div className={cn("grid gap-3", mode === "installment" ? "grid-cols-1" : "grid-cols-2")}>
            {mode !== "installment" && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[var(--color-f2)]">
                  {mode === "recurring" ? "Data de início" : "Data"}
                </label>
                <input type="date" value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[8px] px-3 py-[10px] text-[13px] text-[var(--color-f1)] outline-none h-[40px] focus:border-[var(--color-cyan-border)] transition-all" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[var(--color-f2)]">
                {mode === "installment" ? "Valor por parcela (R$)" : "Valor (R$)"}
              </label>
              <div className="relative">
                <IconCurrencyReal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-f4)] pointer-events-none" />
                <input type="number" step="0.01" min="0" value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[8px] pl-8 pr-3 py-[10px] text-[13px] text-[var(--color-f1)] outline-none h-[40px] focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)]" />
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[var(--color-f2)]">
              {mode === "installment" ? "Descrição base" : "Descrição"}
            </label>
            <input type="text" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[8px] px-3 py-[10px] text-[13px] text-[var(--color-f1)] outline-none h-[40px] focus:border-[var(--color-cyan-border)] transition-all" />
          </div>

          {/* Categoria */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[var(--color-f2)]">Categoria</label>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((cat) => (
                <button key={cat.value} type="button"
                  onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-[8px] text-left border transition-all duration-150 cursor-pointer",
                    form.category === cat.value
                      ? "bg-[var(--color-cyan-faint)] border-[var(--color-cyan-border)]"
                      : "bg-[var(--color-bg3)] border-[var(--color-border)] hover:border-[var(--color-border2)]"
                  )}>
                  <span className={cn("text-[11px] font-medium", form.category === cat.value ? "text-[var(--color-cyan)]" : "text-[var(--color-f2)]")}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[var(--color-f2)]">
              Tags <span className="text-[var(--color-f4)]">(opcional)</span>
            </label>
            <TagPicker initialTags={allTags} selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} />
          </div>

          {/* Recorrência — só para transações únicas ou recorrentes */}
          {mode !== "installment" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[var(--color-f2)]">Recorrência</label>
              <div className="flex gap-2">
                {([
                  { value: "once",    label: "Não repete", icon: IconRepeatOff },
                  { value: "monthly", label: "Todo mês",   icon: IconRepeat },
                  { value: "yearly",  label: "Todo ano",   icon: IconRepeat },
                ] as { value: Recurrence; label: string; icon: typeof IconRepeat }[]).map(({ value, label, icon: Icon }) => (
                  <button key={value} type="button"
                    onClick={() => setForm((f) => ({ ...f, recurrence: value }))}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] font-medium border transition-all cursor-pointer flex-1 justify-center",
                      form.recurrence === value
                        ? "bg-[var(--color-cyan-faint)] border-[var(--color-cyan-border)] text-[var(--color-cyan)]"
                        : "bg-[var(--color-bg3)] border-[var(--color-border)] text-[var(--color-f3)] hover:border-[var(--color-border2)]"
                    )}>
                    <Icon size={11} />{label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <div className="text-[11px] text-[var(--color-red)]">{error}</div>}

          {/* Footer */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-[8px] text-[13px] font-medium bg-transparent border border-[var(--color-border2)] text-[var(--color-f2)] hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-[13px] font-medium bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-all cursor-pointer disabled:opacity-50">
              <IconCheck size={14} />
              {isPending ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { IconPlus, IconX, IconCurrencyReal, IconRepeat, IconRepeatOff, IconStack2, IconReceipt2, IconHome, IconBriefcase, IconBuildingBank } from "@tabler/icons-react";
import { createTransaction, createInstallments } from "@/app/actions/transactions";
import { CREDIT_CATEGORIES, DEBIT_CATEGORIES } from "@/lib/categories";
import { TransactionType, TransactionCategory, Recurrence, Tag } from "@/lib/types";
import type { AccountForSelect } from "@/lib/institutions";
import { TagPicker } from "@/components/tags/TagPicker";
import { cn } from "@/lib/utils";

interface Props {
  allTags: Tag[];
  accounts?: AccountForSelect[];
  onSuccess?: () => void;
}

const today = () => new Date().toISOString().split("T")[0];

export function TransactionForm({ allTags, accounts = [], onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"single" | "installment">("single");
  const [type, setType] = useState<TransactionType>("debit");
  const [form, setForm] = useState({
    date: today(),
    description: "",
    amount: "",
    category: "" as TransactionCategory | "",
    subcategory: "",
    notes: "",
    recurrence: "once" as Recurrence,
    recurrenceEndsAt: "",
    reimbursable: false,
    context: "" as "" | "personal" | "professional",
    accountId: "",
  });
  const [installmentCount, setInstallmentCount] = useState("1");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const categories = type === "credit" ? CREDIT_CATEGORIES : DEBIT_CATEGORIES;

  const perInstallment =
    form.amount && Number(form.amount) > 0 && Number(installmentCount) >= 1
      ? Math.floor((Number(form.amount) / Number(installmentCount)) * 100) / 100
      : null;

  function handleTypeChange(t: TransactionType) {
    setType(t);
    setForm((f) => ({ ...f, category: "" }));
  }

  function handleModeChange(m: "single" | "installment") {
    setMode(m);
    setError("");
    setForm((f) => ({ ...f, recurrence: "once", recurrenceEndsAt: "" }));
  }

  function resetForm() {
    setForm({ date: today(), description: "", amount: "", category: "", subcategory: "", notes: "", recurrence: "once", recurrenceEndsAt: "", reimbursable: false, context: "", accountId: "" });
    setSelectedTagIds([]);
    setInstallmentCount("2");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.description.trim()) return setError("Descrição obrigatória.");
    if (!form.amount || Number(form.amount) <= 0) return setError("Valor deve ser maior que zero.");
    if (!form.category) return setError("Selecione uma categoria.");

    if (mode === "installment") {
      const count = Number(installmentCount);
      if (!count || count < 1 || count > 120) return setError("Número de parcelas deve ser entre 1 e 120.");

      startTransition(async () => {
        await createInstallments({
          firstDate: form.date,
          description: form.description.trim(),
          totalAmount: Number(form.amount),
          count,
          type,
          category: form.category as TransactionCategory,
          notes: form.notes.trim() || undefined,
          tagIds: selectedTagIds,
        });
        resetForm();
        onSuccess?.();
      });
    } else {
      startTransition(async () => {
        await createTransaction({
          date: form.date,
          description: form.description.trim(),
          amount: Number(form.amount),
          type,
          category: form.category as TransactionCategory,
          subcategory: form.subcategory.trim() || undefined,
          notes: form.notes.trim() || undefined,
          recurrence: form.recurrence,
          recurrenceEndsAt: form.recurrenceEndsAt || undefined,
          tagIds: selectedTagIds,
          reimbursable: form.reimbursable,
          context: form.context || undefined,
          accountId: form.accountId || undefined,
        });
        resetForm();
        onSuccess?.();
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Modo */}
      <div>
        <label className="text-[11px] font-medium text-[var(--color-f2)] mb-1.5 block">Modo</label>
        <div className="flex gap-2 bg-[var(--color-bg3)] p-[3px] rounded-[10px]">
          {([
            { value: "single",      label: "Avulsa" },
            { value: "installment", label: "Parcelamento" },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleModeChange(value)}
              className={cn(
                "flex-1 py-2 px-3 rounded-[6px] text-[12px] text-center cursor-pointer transition-all duration-150",
                mode === value
                  ? "bg-[var(--color-bg2)] text-[var(--color-f1)] font-medium border border-[var(--color-border2)]"
                  : "text-[var(--color-f4)] hover:text-[var(--color-f2)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo */}
      <div>
        <label className="text-[11px] font-medium text-[var(--color-f2)] mb-1.5 block">Tipo</label>
        <div className="flex gap-2 bg-[var(--color-bg3)] p-[3px] rounded-[10px]">
          {(["credit", "debit"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className={cn(
                "flex-1 py-2 px-3 rounded-[6px] text-[12px] text-center cursor-pointer transition-all duration-150",
                type === t
                  ? "bg-[var(--color-bg2)] text-[var(--color-f1)] font-medium border border-[var(--color-border2)]"
                  : "text-[var(--color-f4)] hover:text-[var(--color-f2)]"
              )}
            >
              {t === "credit" ? "Crédito" : "Débito"}
            </button>
          ))}
        </div>
      </div>

      {/* Data + Valor */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-[var(--color-f2)]">
            {mode === "installment" ? "1ª parcela em" : "Data"}
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[8px] px-3 py-[11px] text-[13px] text-[var(--color-f1)] outline-none h-[42px] focus:border-[var(--color-cyan-border)] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)] transition-all"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-[var(--color-f2)]">
            {mode === "installment" ? "Valor total (R$)" : "Valor (R$)"}
          </label>
          <div className="relative">
            <IconCurrencyReal size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-f4)] pointer-events-none" />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[8px] pl-9 pr-3 py-[11px] text-[13px] text-[var(--color-f1)] outline-none h-[42px] focus:border-[var(--color-cyan-border)] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)] transition-all placeholder:text-[var(--color-f4)]"
            />
          </div>
        </div>
      </div>

      {/* Parcelas (apenas modo parcelamento) */}
      {mode === "installment" && (
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-[var(--color-f2)]">Número de parcelas</label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <IconStack2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-f4)] pointer-events-none" />
              <input
                type="number"
                min="1"
                max="120"
                placeholder="12"
                value={installmentCount}
                onChange={(e) => setInstallmentCount(e.target.value)}
                className="w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[8px] pl-9 pr-3 py-[11px] text-[13px] text-[var(--color-f1)] outline-none h-[42px] focus:border-[var(--color-cyan-border)] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)] transition-all placeholder:text-[var(--color-f4)]"
              />
            </div>
            {perInstallment && (
              <div className="text-[11px] text-[var(--color-cyan)] bg-[var(--color-cyan-faint)] border border-[var(--color-cyan-border)] rounded-[6px] px-2.5 py-1.5 whitespace-nowrap">
                R$ {perInstallment.toFixed(2).replace(".", ",")} / parcela
              </div>
            )}
          </div>
          <div className="text-[10px] text-[var(--color-f4)] mt-0.5">
            {Number(installmentCount) === 1
              ? "Será criada 1 transação mensal a partir da data acima."
              : `Serão criadas ${installmentCount || "N"} transações mensais a partir da data acima.`}
          </div>
        </div>
      )}

      {/* Descrição */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-[var(--color-f2)]">Descrição</label>
        <input
          type="text"
          placeholder="Ex: Salário, Aluguel, iFood..."
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[8px] px-3 py-[11px] text-[13px] text-[var(--color-f1)] outline-none h-[42px] focus:border-[var(--color-cyan-border)] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)] transition-all placeholder:text-[var(--color-f4)]"
        />
      </div>

      {/* Categoria */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-[var(--color-f2)]">Categoria</label>
        <div className="flex flex-col gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
              className={cn(
                "flex items-start gap-3 px-3 py-2.5 rounded-[8px] text-left border transition-all duration-150 cursor-pointer",
                form.category === cat.value
                  ? "bg-[var(--color-cyan-faint)] border-[var(--color-cyan-border)]"
                  : "bg-[var(--color-bg3)] border-[var(--color-border)] hover:border-[var(--color-border2)]"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className={cn("text-[12px] font-medium", form.category === cat.value ? "text-[var(--color-cyan)]" : "text-[var(--color-f2)]")}>
                  {cat.label}
                </div>
                <div className="text-[10px] text-[var(--color-f4)] mt-0.5">{cat.examples}</div>
              </div>
              {form.category === cat.value && (
                <div className="w-2 h-2 rounded-full bg-[var(--color-cyan)] mt-1 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-[var(--color-f2)]">
          Tags <span className="text-[var(--color-f4)]">(opcional)</span>
        </label>
        <TagPicker
          initialTags={allTags}
          selectedTagIds={selectedTagIds}
          onChange={setSelectedTagIds}
        />
      </div>

      {/* Notas */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-[var(--color-f2)]">
          Notas <span className="text-[var(--color-f4)]">(opcional)</span>
        </label>
        <input
          type="text"
          placeholder="Observação adicional..."
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[8px] px-3 py-[11px] text-[13px] text-[var(--color-f1)] outline-none h-[42px] focus:border-[var(--color-cyan-border)] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)] transition-all placeholder:text-[var(--color-f4)]"
        />
      </div>

      {/* Recorrência (apenas modo transação única) */}
      {mode === "single" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-[var(--color-f2)]">Recorrência</label>
          <div className="flex gap-2">
            {([
              { value: "once",    label: "Não repete",  icon: IconRepeatOff },
              { value: "monthly", label: "Todo mês",    icon: IconRepeat },
              { value: "yearly",  label: "Todo ano",    icon: IconRepeat },
            ] as { value: Recurrence; label: string; icon: typeof IconRepeat }[]).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, recurrence: value }))}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] font-medium border transition-all duration-150 cursor-pointer flex-1 justify-center",
                  form.recurrence === value
                    ? "bg-[var(--color-cyan-faint)] border-[var(--color-cyan-border)] text-[var(--color-cyan)]"
                    : "bg-[var(--color-bg3)] border-[var(--color-border)] text-[var(--color-f3)] hover:border-[var(--color-border2)] hover:text-[var(--color-f2)]"
                )}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
          {form.recurrence === "monthly" && (
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-[11px] text-[var(--color-f3)]">Término (opcional)</label>
              <input
                type="month"
                value={form.recurrenceEndsAt}
                onChange={e => setForm(f => ({ ...f, recurrenceEndsAt: e.target.value }))}
                className="h-[36px] bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[6px] px-3 text-[12px] text-[var(--color-f1)] outline-none focus:border-[rgba(34,211,238,0.28)]"
              />
              <div className="text-[10px] text-[var(--color-cyan)] bg-[var(--color-cyan-faint)] border border-[var(--color-cyan-border)] rounded-[6px] px-2.5 py-1.5">
                {form.recurrenceEndsAt ? `Será projetada até ${form.recurrenceEndsAt}.` : "Sem término definido — será projetada indefinidamente."}
              </div>
            </div>
          )}
          {form.recurrence === "yearly" && (
            <div className="text-[10px] text-[var(--color-cyan)] bg-[var(--color-cyan-faint)] border border-[var(--color-cyan-border)] rounded-[6px] px-2.5 py-1.5 mt-2">
              Será projetada neste mesmo mês nos próximos anos.
            </div>
          )}
        </div>
      )}

      {/* Contexto */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-[var(--color-f2)]">
          Contexto <span className="text-[var(--color-f4)]">(opcional)</span>
        </label>
        <div className="flex gap-2">
          {([
            { value: "personal",     label: "Pessoal",      icon: IconHome },
            { value: "professional", label: "Profissional", icon: IconBriefcase },
          ] as const).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm(f => ({ ...f, context: f.context === value ? "" : value }))}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] font-medium border transition-all duration-150 cursor-pointer flex-1 justify-center",
                form.context === value
                  ? "bg-[var(--color-cyan-faint)] border-[var(--color-cyan-border)] text-[var(--color-cyan)]"
                  : "bg-[var(--color-bg3)] border-[var(--color-border)] text-[var(--color-f3)] hover:border-[var(--color-border2)] hover:text-[var(--color-f2)]"
              )}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Conta (opcional — apenas se há contas cadastradas, apenas modo avulsa) */}
      {accounts.length > 0 && mode === "single" && (
        <div>
          <label className="text-[11px] font-medium text-[var(--color-f2)] mb-1.5 flex items-center gap-1.5 block">
            <IconBuildingBank size={12} className="text-[var(--color-f4)]" />
            Conta (opcional)
          </label>
          <select
            value={form.accountId}
            onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
            className="w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[8px] px-3 h-[38px] text-[13px] text-[var(--color-f1)] outline-none focus:border-[var(--color-cyan-border)] transition-all cursor-pointer"
          >
            <option value="">— Sem conta vinculada —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.institutionName} · {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Reembolsável (apenas débito) */}
      {type === "debit" && (
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, reimbursable: !f.reimbursable }))}
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] border text-left transition-all duration-150 cursor-pointer w-full",
            form.reimbursable
              ? "bg-[rgba(34,211,238,0.06)] border-[var(--color-cyan-border)]"
              : "bg-[var(--color-bg3)] border-[var(--color-border)] hover:border-[var(--color-border2)]"
          )}
        >
          <div className={cn(
            "w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 border transition-all",
            form.reimbursable
              ? "bg-[var(--color-cyan-dim)] border-[var(--color-cyan-border)] text-[var(--color-cyan)]"
              : "bg-[var(--color-bg4)] border-[var(--color-border2)] text-[var(--color-f4)]"
          )}>
            <IconReceipt2 size={15} />
          </div>
          <div>
            <div className={cn("text-[12px] font-medium", form.reimbursable ? "text-[var(--color-cyan)]" : "text-[var(--color-f2)]")}>
              Despesa reembolsável
            </div>
            <div className="text-[10px] text-[var(--color-f4)] mt-0.5">
              {form.reimbursable ? "Será rastreada em /reembolsos" : "Marcar para acompanhar o recebimento"}
            </div>
          </div>
          <div className={cn(
            "ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
            form.reimbursable
              ? "border-[var(--color-cyan)] bg-[var(--color-cyan)]"
              : "border-[var(--color-border2)] bg-transparent"
          )}>
            {form.reimbursable && <div className="w-1.5 h-1.5 rounded-full bg-[#083344]" />}
          </div>
        </button>
      )}

      {error && (
        <div className="text-[11px] text-[var(--color-red)] flex items-center gap-1.5">
          <IconX size={12} /> {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "flex items-center justify-center gap-2 px-5 py-[10px] rounded-[8px] text-[13px] font-medium cursor-pointer border-none transition-all duration-150",
          "bg-[var(--color-cyan)] text-[#083344]",
          "hover:bg-[#38D9F0] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(34,211,238,0.25)]",
          "active:translate-y-0 active:shadow-none",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        )}
      >
        <IconPlus size={15} />
        {isPending
          ? "Salvando..."
          : mode === "installment"
            ? `Criar ${installmentCount || "N"} ${Number(installmentCount) === 1 ? "parcela" : "parcelas"}`
            : "Registrar transação"}
      </button>
    </form>
  );
}

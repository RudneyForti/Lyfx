"use client";

import { useState, useTransition, useEffect } from "react";
import {
  IconHome2, IconCar, IconBox,
  IconPlus, IconPencil, IconTrash, IconChevronDown, IconChevronUp,
  IconCheck, IconX, IconReceipt, IconAlertTriangle, IconCircleCheck,
} from "@tabler/icons-react";
import {
  createAsset, updateAsset, deleteAsset,
  createAssetExpense, updateAssetExpense, deleteAssetExpense, toggleExpensePaid,
} from "@/app/actions/assets";
import type { Asset, AssetExpense } from "@/lib/assets";
import {
  ASSET_TYPE_LABELS, ASSET_EXPENSE_TYPE_LABELS, EXPENSE_SUGGESTIONS,
  type AssetType, type AssetExpenseType,
} from "@/lib/assets";
import { cn } from "@/lib/utils";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  real_estate: <IconHome2 size={16} />,
  vehicle:     <IconCar size={16} />,
  other:       <IconBox size={16} />,
};

// ── Input helpers ─────────────────────────────────────────────────────────────

function inputCls(extra = "") {
  return `w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[8px] px-3 py-[9px] text-[13px] text-[var(--color-f1)] outline-none h-[38px] focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)] ${extra}`;
}
function selectCls() {
  return inputCls("cursor-pointer");
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-medium text-[var(--color-f2)]">{children}</label>;
}
function Row({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return <div className={`grid grid-cols-${cols} gap-3`}>{children}</div>;
}

// ── AssetModal ────────────────────────────────────────────────────────────────

function AssetModal({
  asset, onClose,
}: { asset?: Asset; onClose: () => void }) {
  const editing = !!asset;
  const [isPending, start] = useTransition();
  const [type, setType] = useState(asset?.type ?? "real_estate");
  const [form, setForm] = useState({
    name:            asset?.name ?? "",
    propertyAddress: asset?.propertyAddress ?? "",
    make:            asset?.make ?? "",
    model:           asset?.model ?? "",
    year:            asset?.year != null ? String(asset.year) : "",
    plate:           asset?.plate ?? "",
    purchaseValue:   asset?.purchaseValue != null ? String(asset.purchaseValue) : "",
    currentValue:    asset?.currentValue != null ? String(asset.currentValue) : "",
    purchaseDate:    asset?.purchaseDate
      ? new Date(asset.purchaseDate).toISOString().split("T")[0]
      : "",
    notes: asset?.notes ?? "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      type,
      propertyAddress: type === "real_estate" ? (form.propertyAddress.trim() || null) : null,
      make:  type === "vehicle" ? (form.make.trim() || null) : null,
      model: type === "vehicle" ? (form.model.trim() || null) : null,
      year:  type === "vehicle" && form.year ? Number(form.year) : null,
      plate: type === "vehicle" ? (form.plate.trim() || null) : null,
      // Values are passed as strings to the action; parseBR() handles "1.234,56" server-side
      purchaseValue: form.purchaseValue || null,
      currentValue:  form.currentValue  || null,
      purchaseDate:  form.purchaseDate  || null,
      notes: form.notes.trim() || null,
    };
    start(async () => {
      if (editing) await updateAsset(asset.id, payload);
      else await createAsset(payload);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[14px] w-full max-w-[520px] max-h-[90vh] overflow-y-auto shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--color-border)]">
          <span className="text-[14px] font-semibold text-[var(--color-f1)]">
            {editing ? "Editar bem" : "Novo bem"}
          </span>
          <button type="button" onClick={onClose} className="text-[var(--color-f4)] hover:text-[var(--color-f2)] cursor-pointer transition-colors">
            <IconX size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4 p-6">
          {/* Tipo */}
          <div className="flex flex-col gap-1">
            <Label>Tipo de bem</Label>
            <select className={selectCls()} value={type} onChange={(e) => setType(e.target.value)}>
              {(Object.keys(ASSET_TYPE_LABELS) as AssetType[]).map((k) => (
                <option key={k} value={k}>{ASSET_TYPE_LABELS[k]}</option>
              ))}
            </select>
          </div>

          {/* Nome */}
          <div className="flex flex-col gap-1">
            <Label>Nome / apelido</Label>
            <input required className={inputCls()} value={form.name} onChange={set("name")}
              placeholder={type === "real_estate" ? "Ex: Apartamento Centro" : type === "vehicle" ? "Ex: Carro da família" : "Ex: Relógio herdado"} />
          </div>

          {/* Campos específicos por tipo */}
          {type === "real_estate" && (
            <div className="flex flex-col gap-1">
              <Label>Endereço do imóvel</Label>
              <input className={inputCls()} value={form.propertyAddress} onChange={set("propertyAddress")} placeholder="Ex: Rua das Flores, 42 — São Paulo/SP" />
            </div>
          )}

          {type === "vehicle" && (
            <>
              <Row>
                <div className="flex flex-col gap-1">
                  <Label>Marca</Label>
                  <input className={inputCls()} value={form.make} onChange={set("make")} placeholder="Ex: Toyota" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Modelo</Label>
                  <input className={inputCls()} value={form.model} onChange={set("model")} placeholder="Ex: Corolla" />
                </div>
              </Row>
              <Row>
                <div className="flex flex-col gap-1">
                  <Label>Ano</Label>
                  <input className={inputCls()} inputMode="numeric" value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: e.target.value.replace(/\D/g, "") }))}
                    placeholder="Ex: 2022" maxLength={4} />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Placa</Label>
                  <input className={inputCls("uppercase")} value={form.plate}
                    onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value.toUpperCase() }))}
                    placeholder="Ex: ABC1D23" maxLength={8} />
                </div>
              </Row>
            </>
          )}

          {/* Valores */}
          <Row>
            <div className="flex flex-col gap-1">
              <Label>Valor de compra (R$)</Label>
              <input className={inputCls()} inputMode="decimal" value={form.purchaseValue}
                onChange={(e) => setForm((f) => ({ ...f, purchaseValue: e.target.value.replace(/[^\d.,]/g, "") }))}
                placeholder="0,00" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Valor atual estimado (R$)</Label>
              <input className={inputCls()} inputMode="decimal" value={form.currentValue}
                onChange={(e) => setForm((f) => ({ ...f, currentValue: e.target.value.replace(/[^\d.,]/g, "") }))}
                placeholder="0,00" />
            </div>
          </Row>

          <div className="flex flex-col gap-1">
            <Label>Data de aquisição</Label>
            <input type="date" className={inputCls()} value={form.purchaseDate} onChange={set("purchaseDate")} />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Observações</Label>
            <textarea className="w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[8px] px-3 py-2 text-[13px] text-[var(--color-f1)] outline-none focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)] resize-none"
              rows={2} value={form.notes} onChange={set("notes")} placeholder="Matrícula, detalhes, observações…" />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-medium bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-all cursor-pointer disabled:opacity-50">
              <IconCheck size={14} />
              {isPending ? "Salvando…" : editing ? "Salvar" : "Adicionar bem"}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-[8px] text-[13px] text-[var(--color-f3)] hover:text-[var(--color-f2)] transition-colors cursor-pointer">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── ExpenseForm ───────────────────────────────────────────────────────────────

function ExpenseForm({
  assetId, assetType, expense, onClose,
}: {
  assetId: string;
  assetType: string;
  expense?: AssetExpense;
  onClose: () => void;
}) {
  const editing = !!expense;
  const [isPending, start] = useTransition();
  const suggestions = EXPENSE_SUGGESTIONS[assetType as AssetType] ?? EXPENSE_SUGGESTIONS.other;

  const [form, setForm] = useState({
    type:    expense?.type ?? suggestions[0],
    name:    expense?.name ?? "",
    amount:  expense?.amount != null ? String(expense.amount) : "",
    dueDate: expense?.dueDate ? new Date(expense.dueDate).toISOString().split("T")[0] : "",
    notes:   expense?.notes ?? "",
  });

  // Auto-preenche o nome quando o tipo muda e o nome ainda está vazio/igual a label anterior
  function handleTypeChange(t: string) {
    const label = ASSET_EXPENSE_TYPE_LABELS[t as AssetExpenseType] ?? t;
    setForm((f) => ({
      ...f,
      type: t,
      name: (!f.name || Object.values(ASSET_EXPENSE_TYPE_LABELS).includes(f.name)) ? label : f.name,
    }));
  }

  // [FIX B-1] Initialize name via useEffect, not useState (no side-effects during render)
  useEffect(() => {
    if (!form.name) {
      const label = ASSET_EXPENSE_TYPE_LABELS[form.type as AssetExpenseType] ?? form.type;
      setForm((f) => ({ ...f, name: label }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name:    form.name.trim(),
      type:    form.type,
      amount:  Number(String(form.amount).replace(",", ".")),
      dueDate: form.dueDate || null,
      notes:   form.notes.trim() || null,
    };
    start(async () => {
      if (editing) await updateAssetExpense(expense.id, payload);
      else await createAssetExpense({ assetId, ...payload });
      onClose();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 bg-[var(--color-bg4)] rounded-[10px] p-4 mt-2">
      <div className="text-[11px] font-bold tracking-[1.4px] uppercase text-[var(--color-f4)]">
        {editing ? "Editar despesa" : "Nova despesa"}
      </div>

      <Row>
        <div className="flex flex-col gap-1">
          <Label>Tipo</Label>
          <select className={selectCls()} value={form.type} onChange={(e) => handleTypeChange(e.target.value)}>
            {suggestions.map((k) => (
              <option key={k} value={k}>{ASSET_EXPENSE_TYPE_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Nome / descrição</Label>
          <input required className={inputCls()} value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex: IPTU 2025" />
        </div>
      </Row>

      <Row>
        <div className="flex flex-col gap-1">
          <Label>Valor (R$)</Label>
          <input required className={inputCls()} inputMode="decimal" value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value.replace(/[^\d.,]/g, "") }))}
            placeholder="0,00" />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Vencimento</Label>
          <input type="date" className={inputCls()} value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
        </div>
      </Row>

      <div className="flex gap-2">
        <button type="submit" disabled={isPending}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[7px] text-[12px] font-medium bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-all cursor-pointer disabled:opacity-50">
          <IconCheck size={12} />
          {isPending ? "Salvando…" : editing ? "Salvar" : "Adicionar"}
        </button>
        <button type="button" onClick={onClose}
          className="px-3 py-1.5 rounded-[7px] text-[12px] text-[var(--color-f3)] hover:text-[var(--color-f2)] transition-colors cursor-pointer">
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── ExpenseRow ────────────────────────────────────────────────────────────────

function ExpenseRow({ expense, assetType }: { expense: AssetExpense; assetType: string }) {
  const [editing, setEditing] = useState(false);
  const [isPending, start] = useTransition();

  const overdue = !expense.paid && expense.dueDate && new Date(expense.dueDate) < new Date();

  if (editing) {
    return (
      <ExpenseForm
        assetId={expense.assetId}
        assetType={assetType}
        expense={expense}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-3 py-2.5 px-3 rounded-[8px] transition-colors group",
      expense.paid ? "opacity-50" : overdue ? "bg-[var(--color-red-dim)]" : "hover:bg-white/[0.03]",
    )}>
      {/* Toggle pago */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => start(async () => { await toggleExpensePaid(expense.id, !expense.paid); })}
        className={cn(
          "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all cursor-pointer",
          expense.paid
            ? "bg-[var(--color-green)] border-[var(--color-green)]"
            : overdue
              ? "border-[var(--color-red)] hover:bg-[var(--color-red-dim)]"
              : "border-[var(--color-border2)] hover:border-[var(--color-cyan-border)]",
        )}
      >
        {expense.paid && <IconCheck size={11} stroke={2.5} className="text-black" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-[var(--color-f1)] truncate">{expense.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[var(--color-bg5)] text-[var(--color-f3)] shrink-0">
            {ASSET_EXPENSE_TYPE_LABELS[expense.type as AssetExpenseType] ?? expense.type}
          </span>
          {overdue && (
            <span className="text-[10px] text-[var(--color-red)] flex items-center gap-0.5 shrink-0">
              <IconAlertTriangle size={11} /> Vencida
            </span>
          )}
        </div>
        {expense.dueDate && (
          <div className="text-[11px] text-[var(--color-f4)] mt-0.5">
            Vence {fmtDate(expense.dueDate)}
            {expense.paid && expense.paidAt && ` · Pago em ${fmtDate(expense.paidAt)}`}
          </div>
        )}
      </div>

      <div className="text-[13px] font-medium text-[var(--color-f1)] shrink-0">
        {fmt(expense.amount)}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button type="button" onClick={() => setEditing(true)}
          className="p-1 rounded-[5px] text-[var(--color-f4)] hover:text-[var(--color-cyan)] hover:bg-[var(--color-cyan-dim)] transition-all cursor-pointer">
          <IconPencil size={12} />
        </button>
        <button type="button"
          onClick={() => start(async () => { await deleteAssetExpense(expense.id); })}
          disabled={isPending}
          className="p-1 rounded-[5px] text-[var(--color-f4)] hover:text-[var(--color-red)] hover:bg-[var(--color-red-dim)] transition-all cursor-pointer">
          <IconTrash size={12} />
        </button>
      </div>
    </div>
  );
}

// ── AssetCard ─────────────────────────────────────────────────────────────────

function AssetCard({ asset }: { asset: Asset }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  const [isPending, start] = useTransition();

  const totalExpenses = asset.expenses.reduce((s, e) => s + e.amount, 0);
  const paidCount = asset.expenses.filter((e) => e.paid).length;
  const pendingCount = asset.expenses.length - paidCount;
  const overdueCount = asset.expenses.filter(
    (e) => !e.paid && e.dueDate && new Date(e.dueDate) < new Date()
  ).length;

  const subtitle =
    asset.type === "vehicle"
      ? [asset.make, asset.model, asset.year].filter(Boolean).join(" · ")
      : asset.type === "real_estate"
        ? asset.propertyAddress ?? ""
        : "";

  return (
    <>
      {editing && <AssetModal asset={asset} onClose={() => setEditing(false)} />}

      <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors select-none"
          onClick={() => setExpanded((o) => !o)}
        >
          <div className="w-9 h-9 rounded-[8px] bg-[var(--color-bg4)] flex items-center justify-center text-[var(--color-cyan)] shrink-0">
            {TYPE_ICON[asset.type] ?? <IconBox size={16} />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-[var(--color-f1)] truncate">{asset.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[var(--color-bg4)] text-[var(--color-f4)] shrink-0">
                {ASSET_TYPE_LABELS[asset.type as AssetType] ?? asset.type}
              </span>
              {asset.plate && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] border border-[var(--color-border2)] text-[var(--color-f3)] font-mono shrink-0">
                  {asset.plate}
                </span>
              )}
            </div>
            {subtitle && <div className="text-[12px] text-[var(--color-f3)] mt-0.5 truncate">{subtitle}</div>}
          </div>

          {/* Métricas */}
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            {asset.currentValue != null && (
              <div className="text-right">
                <div className="text-[11px] text-[var(--color-f4)]">Valor atual</div>
                <div className="text-[13px] font-medium text-[var(--color-f1)]">{fmt(asset.currentValue)}</div>
              </div>
            )}
            {asset.expenses.length > 0 && (
              <div className="text-right">
                <div className="text-[11px] text-[var(--color-f4)]">Despesas</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-medium text-[var(--color-f1)]">{fmt(totalExpenses)}</span>
                  {overdueCount > 0 && (
                    <span className="text-[10px] text-[var(--color-red)] flex items-center gap-0.5">
                      <IconAlertTriangle size={10} />{overdueCount}
                    </span>
                  )}
                  {pendingCount > 0 && overdueCount === 0 && (
                    <span className="text-[10px] text-[var(--color-f4)]">{pendingCount} pend.</span>
                  )}
                  {pendingCount === 0 && asset.expenses.length > 0 && (
                    <IconCircleCheck size={13} className="text-[var(--color-green)]" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setEditing(true)}
              className="p-1.5 rounded-[6px] text-[var(--color-f4)] hover:text-[var(--color-cyan)] hover:bg-[var(--color-cyan-dim)] transition-all cursor-pointer">
              <IconPencil size={14} />
            </button>
            <button type="button"
              onClick={() => { if (confirm(`Excluir "${asset.name}"?`)) start(async () => { await deleteAsset(asset.id); }); }}
              disabled={isPending}
              className="p-1.5 rounded-[6px] text-[var(--color-f4)] hover:text-[var(--color-red)] hover:bg-[var(--color-red-dim)] transition-all cursor-pointer">
              <IconTrash size={14} />
            </button>
            <div className="ml-1 text-[var(--color-f4)]">
              {expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
            </div>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-[var(--color-border)] px-4 py-3">
            {/* Info extra */}
            {(asset.purchaseValue != null || asset.purchaseDate != null) && (
              <div className="flex gap-4 mb-3 text-[12px] text-[var(--color-f3)]">
                {asset.purchaseValue != null && (
                  <span>Compra: <span className="text-[var(--color-f2)]">{fmt(asset.purchaseValue)}</span></span>
                )}
                {asset.purchaseDate != null && (
                  <span>Data: <span className="text-[var(--color-f2)]">{fmtDate(asset.purchaseDate)}</span></span>
                )}
                {asset.currentValue != null && asset.purchaseValue != null && (
                  <span>
                    Variação:{" "}
                    <span className={asset.currentValue >= asset.purchaseValue ? "text-[var(--color-green)]" : "text-[var(--color-red)]"}>
                      {asset.currentValue >= asset.purchaseValue ? "+" : ""}
                      {fmt(asset.currentValue - asset.purchaseValue)}
                    </span>
                  </span>
                )}
              </div>
            )}
            {asset.notes && (
              <p className="text-[12px] text-[var(--color-f3)] mb-3 italic">{asset.notes}</p>
            )}

            {/* Expenses list */}
            <div className="text-[10px] font-bold tracking-[1.4px] uppercase text-[var(--color-f4)] mb-2 flex items-center gap-2">
              <IconReceipt size={11} />
              Impostos e despesas
            </div>

            {asset.expenses.length === 0 && !addingExpense && (
              <p className="text-[12px] text-[var(--color-f4)] mb-2">Nenhuma despesa cadastrada.</p>
            )}

            <div className="flex flex-col">
              {asset.expenses.map((exp) => (
                <ExpenseRow key={exp.id} expense={exp} assetType={asset.type} />
              ))}
            </div>

            {addingExpense ? (
              <ExpenseForm
                assetId={asset.id}
                assetType={asset.type}
                onClose={() => setAddingExpense(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setAddingExpense(true)}
                className="mt-2 flex items-center gap-1.5 text-[12px] text-[var(--color-cyan)] hover:opacity-70 transition-opacity cursor-pointer"
              >
                <IconPlus size={13} /> Adicionar despesa
              </button>
            )}

            {/* Total */}
            {asset.expenses.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-[12px]">
                <span className="text-[var(--color-f4)]">Total de despesas</span>
                <div className="flex items-center gap-3">
                  <span className="text-[var(--color-green)]">{fmt(asset.expenses.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0))} pago</span>
                  <span className="text-[var(--color-f3)]">{fmt(asset.expenses.filter((e) => !e.paid).reduce((s, e) => s + e.amount, 0))} pendente</span>
                  <span className="font-semibold text-[var(--color-f1)]">{fmt(totalExpenses)} total</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── SummaryCard ───────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, color = "var(--color-cyan)" }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[10px] px-4 py-3 flex flex-col gap-0.5">
      <div className="text-[10px] font-medium text-[var(--color-f4)] uppercase tracking-[1px]">{label}</div>
      <div className="text-[22px] font-bold leading-tight" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-[var(--color-f4)]">{sub}</div>}
    </div>
  );
}

// ── AssetsView ────────────────────────────────────────────────────────────────

interface Props {
  assets: Asset[];
}

export function AssetsView({ assets }: Props) {
  const [showModal, setShowModal] = useState(false);

  const totalCurrentValue = assets.reduce((s, a) => s + (a.currentValue ?? 0), 0);
  const totalExpenses = assets.flatMap((a) => a.expenses).reduce((s, e) => s + e.amount, 0);
  const pendingTotal = assets.flatMap((a) => a.expenses).filter((e) => !e.paid).reduce((s, e) => s + e.amount, 0);
  const overdueCount = assets.flatMap((a) => a.expenses).filter(
    (e) => !e.paid && e.dueDate && new Date(e.dueDate) < new Date()
  ).length;

  const byType = {
    real_estate: assets.filter((a) => a.type === "real_estate"),
    vehicle:     assets.filter((a) => a.type === "vehicle"),
    other:       assets.filter((a) => a.type === "other"),
  };

  return (
    <div className="p-8 max-w-[760px]">
      {showModal && <AssetModal onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2.5 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
        Patrimônio
      </div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] leading-tight">
            Bens e <span className="text-[var(--color-cyan)]">Imóveis</span>
          </h1>
          <p className="text-[var(--color-f3)] text-sm mt-1">
            Controle seus bens, impostos e despesas associadas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-[13px] font-medium bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-all cursor-pointer shrink-0"
        >
          <IconPlus size={15} /> Novo bem
        </button>
      </div>

      {/* Summary */}
      {assets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <SummaryCard label="Bens cadastrados" value={String(assets.length)} sub={`${byType.real_estate.length} imóv · ${byType.vehicle.length} veíc`} />
          <SummaryCard label="Valor total estimado" value={fmt(totalCurrentValue)} />
          <SummaryCard
            label="Custo anual total"
            value={fmt(totalExpenses)}
            sub={`${fmt(pendingTotal)} pendente`}
            color={pendingTotal > 0 ? "var(--color-red)" : "var(--color-green)"}
          />
          <SummaryCard
            label="Despesas vencidas"
            value={String(overdueCount)}
            sub={overdueCount > 0 ? "Requer atenção" : "Em dia"}
            color={overdueCount > 0 ? "var(--color-red)" : "var(--color-green)"}
          />
        </div>
      )}

      {/* Empty state */}
      {assets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-bg3)] flex items-center justify-center text-[var(--color-f4)] mb-4">
            <IconHome2 size={28} />
          </div>
          <div className="text-[15px] font-semibold text-[var(--color-f2)] mb-1">Nenhum bem cadastrado</div>
          <div className="text-[13px] text-[var(--color-f4)] mb-6 max-w-[300px]">
            Registre imóveis, veículos e outros bens para acompanhar impostos e despesas.
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-[13px] font-medium bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-all cursor-pointer"
          >
            <IconPlus size={15} /> Cadastrar primeiro bem
          </button>
        </div>
      )}

      {/* Asset groups */}
      {(["real_estate", "vehicle", "other"] as AssetType[]).map((type) => {
        const group = byType[type];
        if (group.length === 0) return null;
        return (
          <div key={type} className="mb-8">
            <div className="flex items-center gap-2 mb-3 text-[var(--color-f3)]">
              {TYPE_ICON[type]}
              <span className="text-[11px] font-bold tracking-[1.4px] uppercase">{ASSET_TYPE_LABELS[type]}</span>
              <span className="text-[11px] text-[var(--color-f4)]">({group.length})</span>
            </div>
            <div className="flex flex-col gap-3">
              {group.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

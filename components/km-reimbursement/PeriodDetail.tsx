"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  createKmRoute, updateKmRoute, deleteKmRoute,
  createKmReceipt, deleteKmReceipt,
  createKmExpense, deleteKmExpense,
  submitPeriod, reopenPeriod,
} from "@/app/actions/km-reimbursement";
import type { KmPeriodDetail, KmConfigData, KmRouteData, KmReceiptData, KmExpenseData } from "@/app/actions/km-reimbursement";
import { RouteMap } from "./RouteMap";
import {
  IconArrowLeft, IconPlus, IconTrash, IconMap,
  IconRoute, IconGasStation, IconReceipt, IconFileText,
  IconClock, IconCheck, IconSend, IconRefresh,
  IconCopy, IconPencil, IconX, IconSettings,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR");
}
function fmtDateInput(d: Date | string) {
  return new Date(d).toISOString().split("T")[0];
}
function today() {
  return new Date().toISOString().split("T")[0];
}
function inputCls(extra = "") {
  return `w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[10px] px-3 py-[7px] text-[12px] text-[var(--color-f1)] outline-none h-[34px] focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)] ${extra}`;
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] font-medium text-[var(--color-f3)]">{children}</label>;
}

const EXPENSE_TYPE_LABELS: Record<string, string> = {
  toll: "Pedágio",
  parking: "Estacionamento",
  accommodation: "Hospedagem",
  food: "Alimentação",
  taxi: "Taxi / Uber",
  other: "Outro",
};

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ label, count, onAdd }: { label: string; count: number; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">{label}</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[var(--color-bg3)] text-[var(--color-f4)] border border-[var(--color-border2)]">{count}</span>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[11px] font-medium text-[var(--color-cyan)] bg-[rgba(34,211,238,0.08)] border border-[rgba(34,211,238,0.2)] hover:bg-[rgba(34,211,238,0.12)] transition-colors cursor-pointer"
      >
        <IconPlus size={11} />
        Adicionar
      </button>
    </div>
  );
}

// ── Empty row ─────────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center py-8 text-center border border-dashed border-[var(--color-border2)] rounded-[10px]">
      <span className="text-[12px] text-[var(--color-f4)]">Nenhum {label} registrado</span>
    </div>
  );
}

// ── Routes Tab ────────────────────────────────────────────────────────────────

function RouteForm({ periodId, route, onDone }: {
  periodId: string;
  route?: KmRouteData;
  onDone: () => void;
}) {
  const [isPending, start] = useTransition();
  const [showMap, setShowMap] = useState(false);
  const [form, setForm] = useState({
    date: route ? fmtDateInput(route.date) : today(),
    origin: route?.origin ?? "",
    destination: route?.destination ?? "",
    km: route?.km != null ? String(route.km) : "",
    notes: route?.notes ?? "",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const data = {
        date: form.date,
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        km: parseFloat(form.km) || 0,
        notes: form.notes.trim() || undefined,
      };
      if (route) await updateKmRoute(route.id, data);
      else await createKmRoute({ periodId, ...data });
      onDone();
    });
  }

  return (
    <div className="bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] p-4 mb-3">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label>Data</Label>
            <input type="date" className={inputCls()} value={form.date} onChange={set("date")} required />
          </div>
          <div className="flex flex-col gap-1">
            <Label>KM rodados</Label>
            <input type="number" step="0.1" min="0" className={inputCls()} placeholder="0.0" value={form.km} onChange={set("km")} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label>Origem</Label>
            <input className={inputCls()} placeholder="Rua, cidade..." value={form.origin} onChange={set("origin")} required />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Destino</Label>
            <input className={inputCls()} placeholder="Rua, cidade..." value={form.destination} onChange={set("destination")} required />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Observações <span className="text-[var(--color-f4)] font-normal">(opcional)</span></Label>
          <input className={inputCls()} placeholder="Motivo da viagem..." value={form.notes} onChange={set("notes")} />
        </div>

        {/* Map */}
        {(form.origin || form.destination) && (
          <button
            type="button"
            onClick={() => setShowMap(v => !v)}
            className="flex items-center gap-1.5 text-[11px] text-[var(--color-cyan)] w-fit cursor-pointer bg-transparent border-0 p-0 hover:opacity-80"
          >
            <IconMap size={12} />
            {showMap ? "Ocultar mapa" : "Ver no mapa"}
          </button>
        )}
        {showMap && (
          <div className="h-[220px] rounded-[12px] overflow-hidden">
            <RouteMap
              origin={form.origin}
              destination={form.destination}
              onKmChange={km => setForm(f => ({ ...f, km: String(km) }))}
            />
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold text-white cursor-pointer border-0 disabled:opacity-50"
            style={{ background: "var(--color-cyan)" }}
          >
            <IconCheck size={12} />
            {isPending ? "Salvando..." : route ? "Salvar" : "Adicionar"}
          </button>
          <button type="button" onClick={onDone} className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[11px] text-[var(--color-f3)] bg-[var(--color-bg4)] border border-[var(--color-border2)] cursor-pointer hover:text-[var(--color-f1)] transition-colors">
            <IconX size={11} />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function RouteRow({ route, open, onEdit, onDelete }: {
  route: KmRouteData;
  open: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isPending, start] = useTransition();
  function handleDelete() {
    if (!confirm("Excluir trajeto?")) return;
    start(() => onDelete());
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] last:border-0 group">
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-[var(--color-f1)] truncate">
          {route.origin} → {route.destination}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[10px] text-[var(--color-f4)]">{fmtDate(route.date)}</span>
          <span className="text-[10px] text-[var(--color-cyan)] font-medium">{route.km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km</span>
          {route.notes && <span className="text-[10px] text-[var(--color-f4)] truncate max-w-[200px]">{route.notes}</span>}
        </div>
      </div>
      {open && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[var(--color-f4)] hover:text-[var(--color-f2)] hover:bg-[var(--color-bg4)] cursor-pointer border-0 bg-transparent transition-colors">
            <IconPencil size={11} />
          </button>
          <button onClick={handleDelete} disabled={isPending} className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[var(--color-f4)] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] cursor-pointer border-0 bg-transparent transition-colors">
            <IconTrash size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

function RoutesTab({ period }: { period: KmPeriodDetail }) {
  const isOpen = period.status === "open";
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [, startDel] = useTransition();

  return (
    <div>
      {isOpen && <SectionHeader label="Trajetos" count={period.routes.length} onAdd={() => { setAdding(true); setEditing(null); }} />}
      {!isOpen && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">Trajetos</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[var(--color-bg3)] text-[var(--color-f4)] border border-[var(--color-border2)]">{period.routes.length}</span>
        </div>
      )}

      {adding && <RouteForm periodId={period.id} onDone={() => setAdding(false)} />}

      {period.routes.length === 0 && !adding && <EmptyState label="trajeto" />}

      {period.routes.length > 0 && (
        <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] overflow-hidden">
          {period.routes.map(r => editing === r.id ? (
            <div key={r.id} className="p-3 border-b border-[var(--color-border)] last:border-0">
              <RouteForm periodId={period.id} route={r} onDone={() => setEditing(null)} />
            </div>
          ) : (
            <RouteRow
              key={r.id}
              route={r}
              open={isOpen}
              onEdit={() => setEditing(r.id)}
              onDelete={() => startDel(() => deleteKmRoute(r.id))}
            />
          ))}
        </div>
      )}

      {period.routes.length > 0 && (
        <div className="flex justify-end mt-2">
          <span className="text-[11px] text-[var(--color-f3)]">
            Total: <span className="font-semibold text-[var(--color-f1)]">
              {period.totalKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

// ── Receipts Tab ──────────────────────────────────────────────────────────────

function ReceiptForm({ periodId, onDone }: { periodId: string; onDone: () => void }) {
  const [isPending, start] = useTransition();
  const [form, setForm] = useState({
    date: today(),
    fuelType: "gasoline",
    liters: "",
    totalAmount: "",
    notes: "",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      await createKmReceipt({
        periodId,
        date: form.date,
        fuelType: form.fuelType,
        liters: parseFloat(form.liters) || 0,
        totalAmount: parseFloat(form.totalAmount) || 0,
        notes: form.notes.trim() || undefined,
      });
      onDone();
    });
  }

  const pricePerLiter = form.liters && form.totalAmount
    ? (parseFloat(form.totalAmount) / parseFloat(form.liters)).toFixed(3)
    : null;

  return (
    <div className="bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] p-4 mb-3">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <Label>Data</Label>
            <input type="date" className={inputCls()} value={form.date} onChange={set("date")} required />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Combustível</Label>
            <select className={inputCls("cursor-pointer")} value={form.fuelType} onChange={set("fuelType")}>
              <option value="gasoline">Gasolina</option>
              <option value="ethanol">Etanol</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Litros</Label>
            <input type="number" step="0.01" min="0" className={inputCls()} placeholder="0.00" value={form.liters} onChange={set("liters")} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label>Valor total (R$)</Label>
            <input type="number" step="0.01" min="0" className={inputCls()} placeholder="0.00" value={form.totalAmount} onChange={set("totalAmount")} required />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Observações <span className="text-[var(--color-f4)] font-normal">(opcional)</span></Label>
            <input className={inputCls()} placeholder="Posto, cidade..." value={form.notes} onChange={set("notes")} />
          </div>
        </div>
        {pricePerLiter && (
          <div className="text-[10px] text-[var(--color-f4)]">
            Preço por litro: <span className="font-medium text-[var(--color-cyan)]">R$ {pricePerLiter}</span>
          </div>
        )}
        <div className="flex items-center gap-2 pt-1">
          <button type="submit" disabled={isPending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold text-white cursor-pointer border-0 disabled:opacity-50" style={{ background: "var(--color-cyan)" }}>
            <IconCheck size={12} />
            {isPending ? "Salvando..." : "Adicionar"}
          </button>
          <button type="button" onClick={onDone} className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[11px] text-[var(--color-f3)] bg-[var(--color-bg4)] border border-[var(--color-border2)] cursor-pointer hover:text-[var(--color-f1)] transition-colors">
            <IconX size={11} />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function ReceiptsTab({ period, config }: { period: KmPeriodDetail; config: KmConfigData }) {
  const isOpen = period.status === "open";
  const [adding, setAdding] = useState(false);
  const [, startDel] = useTransition();

  const totalFuelAmount = period.receipts.reduce((s, r) => s + r.totalAmount, 0);
  const minRequired = period.kmAmount * config.minFuelPct;
  const fuelOk = totalFuelAmount >= minRequired;

  return (
    <div>
      {isOpen && <SectionHeader label="Notas de Combustível" count={period.receipts.length} onAdd={() => setAdding(true)} />}
      {!isOpen && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">Notas de Combustível</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[var(--color-bg3)] text-[var(--color-f4)] border border-[var(--color-border2)]">{period.receipts.length}</span>
        </div>
      )}

      {adding && <ReceiptForm periodId={period.id} onDone={() => setAdding(false)} />}

      {period.receipts.length === 0 && !adding && <EmptyState label="nota de combustível" />}

      {period.receipts.length > 0 && (
        <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] overflow-hidden">
          {period.receipts.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] last:border-0 group">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-[var(--color-f1)]">
                  {r.fuelType === "ethanol" ? "Etanol" : "Gasolina"} · {r.liters.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} L
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-[var(--color-f4)]">{fmtDate(r.date)}</span>
                  <span className="text-[10px] text-[var(--color-f4)]">
                    R$ {(r.totalAmount / r.liters).toFixed(3)}/litro
                  </span>
                  {r.notes && <span className="text-[10px] text-[var(--color-f4)] truncate">{r.notes}</span>}
                </div>
              </div>
              <div className="text-[13px] font-semibold text-[var(--color-f1)]">{fmt(r.totalAmount)}</div>
              {isOpen && (
                <button
                  onClick={() => { if (!confirm("Excluir nota?")) return; startDel(() => deleteKmReceipt(r.id)); }}
                  className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[var(--color-f4)] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] cursor-pointer border-0 bg-transparent transition-colors opacity-0 group-hover:opacity-100"
                >
                  <IconTrash size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer summary */}
      {period.receipts.length > 0 && (
        <div className="mt-3 p-3 bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[10px] flex flex-col gap-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-[var(--color-f4)]">Preço médio/litro</span>
            <span className="font-medium text-[var(--color-f1)]">
              R$ {period.fuelPriceAvg.toFixed(3)}
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-[var(--color-f4)]">Total das notas</span>
            <span className="font-medium text-[var(--color-f1)]">{fmt(totalFuelAmount)}</span>
          </div>
          {period.kmAmount > 0 && (
            <div className={cn("flex justify-between text-[11px] pt-1 border-t border-[var(--color-border2)]", fuelOk ? "text-[var(--color-green)]" : "text-[var(--color-amber)]")}>
              <span>Mínimo exigido ({(config.minFuelPct * 100).toFixed(0)}% do valor km)</span>
              <span className="font-medium">{fmt(minRequired)} {fuelOk ? "✓" : "✗"}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Expenses Tab ──────────────────────────────────────────────────────────────

function ExpenseForm({ periodId, onDone }: { periodId: string; onDone: () => void }) {
  const [isPending, start] = useTransition();
  const [form, setForm] = useState({
    date: today(),
    type: "toll",
    amount: "",
    notes: "",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      await createKmExpense({
        periodId,
        date: form.date,
        type: form.type,
        amount: parseFloat(form.amount) || 0,
        notes: form.notes.trim() || undefined,
      });
      onDone();
    });
  }

  return (
    <div className="bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] p-4 mb-3">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <Label>Data</Label>
            <input type="date" className={inputCls()} value={form.date} onChange={set("date")} required />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Tipo</Label>
            <select className={inputCls("cursor-pointer")} value={form.type} onChange={set("type")}>
              {Object.entries(EXPENSE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Valor (R$)</Label>
            <input type="number" step="0.01" min="0" className={inputCls()} placeholder="0.00" value={form.amount} onChange={set("amount")} required />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Observações <span className="text-[var(--color-f4)] font-normal">(opcional)</span></Label>
          <input className={inputCls()} placeholder="Detalhes..." value={form.notes} onChange={set("notes")} />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button type="submit" disabled={isPending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold text-white cursor-pointer border-0 disabled:opacity-50" style={{ background: "var(--color-cyan)" }}>
            <IconCheck size={12} />
            {isPending ? "Salvando..." : "Adicionar"}
          </button>
          <button type="button" onClick={onDone} className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[11px] text-[var(--color-f3)] bg-[var(--color-bg4)] border border-[var(--color-border2)] cursor-pointer hover:text-[var(--color-f1)] transition-colors">
            <IconX size={11} />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function ExpensesTab({ period }: { period: KmPeriodDetail }) {
  const isOpen = period.status === "open";
  const [adding, setAdding] = useState(false);
  const [, startDel] = useTransition();

  // Group by type for totals
  const byType = period.expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + e.amount;
    return acc;
  }, {});

  return (
    <div>
      {isOpen && <SectionHeader label="Despesas Extras" count={period.expenses.length} onAdd={() => setAdding(true)} />}
      {!isOpen && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">Despesas Extras</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[var(--color-bg3)] text-[var(--color-f4)] border border-[var(--color-border2)]">{period.expenses.length}</span>
        </div>
      )}

      {adding && <ExpenseForm periodId={period.id} onDone={() => setAdding(false)} />}

      {period.expenses.length === 0 && !adding && <EmptyState label="despesa extra" />}

      {period.expenses.length > 0 && (
        <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] overflow-hidden">
          {period.expenses.map(e => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] last:border-0 group">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-[var(--color-f1)]">
                  {EXPENSE_TYPE_LABELS[e.type] ?? e.type}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-[var(--color-f4)]">{fmtDate(e.date)}</span>
                  {e.notes && <span className="text-[10px] text-[var(--color-f4)] truncate">{e.notes}</span>}
                </div>
              </div>
              <div className="text-[13px] font-semibold text-[var(--color-f1)]">{fmt(e.amount)}</div>
              {isOpen && (
                <button
                  onClick={() => { if (!confirm("Excluir despesa?")) return; startDel(() => deleteKmExpense(e.id)); }}
                  className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[var(--color-f4)] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] cursor-pointer border-0 bg-transparent transition-colors opacity-0 group-hover:opacity-100"
                >
                  <IconTrash size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Subtotals by type */}
      {Object.keys(byType).length > 1 && (
        <div className="mt-3 p-3 bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[10px] flex flex-col gap-1.5">
          {Object.entries(byType).map(([type, total]) => (
            <div key={type} className="flex justify-between text-[11px]">
              <span className="text-[var(--color-f4)]">{EXPENSE_TYPE_LABELS[type] ?? type}</span>
              <span className="font-medium text-[var(--color-f1)]">{fmt(total)}</span>
            </div>
          ))}
          <div className="flex justify-between text-[11px] pt-1 border-t border-[var(--color-border2)]">
            <span className="text-[var(--color-f4)]">Total</span>
            <span className="font-semibold text-[var(--color-f1)]">{fmt(period.extraAmount)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Summary Tab ───────────────────────────────────────────────────────────────

function SummaryTab({ period, config }: { period: KmPeriodDetail; config: KmConfigData }) {
  const [isPending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  const isOpen = period.status === "open";
  const totalFuelAmount = period.receipts.reduce((s, r) => s + r.totalAmount, 0);
  const minRequired = period.kmAmount * config.minFuelPct;
  const fuelOk = totalFuelAmount >= minRequired;
  const canSubmit = isOpen && period.totalKm > 0 && fuelOk;

  // Build by expense type
  const byType = period.expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + e.amount;
    return acc;
  }, {});

  const startStr = new Date(period.startDate).toLocaleDateString("pt-BR");
  const endStr   = new Date(period.endDate).toLocaleDateString("pt-BR");
  const fuelLabel = period.fuelType === "ethanol" ? "Etanol" : "Gasolina";
  const taxaPct   = period.fuelType === "ethanol"
    ? (config.ethanolRate * 100).toFixed(0)
    : (config.gasolineRate * 100).toFixed(0);

  const summaryLines = [
    `Período: ${startStr} a ${endStr}`,
    `Combustível: ${fuelLabel} · Preço médio: R$ ${period.fuelPriceAvg.toFixed(3)}/litro`,
    `Taxa/km: R$ ${period.ratePerKm.toFixed(4)} (${taxaPct}% × R$ ${period.fuelPriceAvg.toFixed(3)})`,
    `Km rodados: ${period.totalKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`,
    `Valor km: ${fmt(period.kmAmount)}`,
    ...(period.expenses.length > 0 ? [
      "─────────────────────────────",
      ...Object.entries(byType).map(([type, total]) => `${EXPENSE_TYPE_LABELS[type] ?? type}: ${fmt(total)}`),
    ] : []),
    "─────────────────────────────",
    `TOTAL GERAL: ${fmt(period.grandTotal)}`,
    "─────────────────────────────",
    `Notas apresentadas: ${fmt(totalFuelAmount)} (mín. ${fmt(minRequired)} ${fuelOk ? "✓" : "✗"})`,
  ];
  const summaryText = summaryLines.join("\n");

  function handleCopy() {
    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSubmit() {
    if (!confirm("Marcar como enviado? Isso criará uma transação de crédito no prazo previsto.")) return;
    start(() => submitPeriod(period.id));
  }

  function handleReopen() {
    if (!confirm("Reabrir solicitação? A transação associada será excluída.")) return;
    start(() => reopenPeriod(period.id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">Resumo para SAP</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[11px] font-medium cursor-pointer border transition-all"
          style={copied
            ? { color: "#22c55e", background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)" }
            : { color: "var(--color-f3)", background: "var(--color-bg3)", borderColor: "var(--color-border2)" }}
        >
          {copied ? <IconCheck size={11} /> : <IconCopy size={11} />}
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>

      {/* Summary box */}
      <div className="bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] p-4 mb-4 font-mono text-[12px] leading-relaxed text-[var(--color-f2)] whitespace-pre-wrap select-all">
        {summaryText}
      </div>

      {/* Total */}
      <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-[var(--color-f4)] mb-1">Total geral</div>
            <div className="text-[28px] font-bold font-[family-name:var(--font-display)] italic text-[var(--color-f1)]">
              {fmt(period.grandTotal)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-[var(--color-f3)]">{period.totalKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km</div>
            <div className="text-[11px] text-[var(--color-f4)]">R$ {period.ratePerKm.toFixed(4)}/km</div>
          </div>
        </div>

        {/* Fuel validation */}
        {period.kmAmount > 0 && (
          <div className={cn(
            "flex items-center gap-2 mt-3 pt-3 border-t border-[var(--color-border2)] text-[11px]",
            fuelOk ? "text-[var(--color-green)]" : "text-[var(--color-amber)]"
          )}>
            {fuelOk ? <IconCheck size={13} /> : <span className="font-bold">!</span>}
            {fuelOk
              ? `Notas OK: ${fmt(totalFuelAmount)} ≥ mínimo ${fmt(minRequired)}`
              : `Notas insuficientes: ${fmt(totalFuelAmount)} < mínimo ${fmt(minRequired)}`
            }
          </div>
        )}
      </div>

      {/* Status / actions */}
      {isOpen ? (
        <div className="flex flex-col gap-2">
          {!canSubmit && (
            <div className="text-[11px] text-[var(--color-f4)] text-center">
              {period.totalKm === 0
                ? "Adicione ao menos um trajeto para enviar."
                : "Notas de combustível insuficientes para o mínimo exigido."}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] font-semibold text-white cursor-pointer border-0 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            style={{ background: "var(--color-cyan)" }}
          >
            <IconSend size={14} />
            {isPending ? "Enviando..." : "Marcar como Enviado"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Submitted info */}
          <div className="flex items-center gap-3 p-3 bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.2)] rounded-[10px]">
            <IconClock size={16} className="text-[var(--color-amber)] flex-shrink-0" />
            <div className="flex-1">
              <div className="text-[11px] font-semibold text-[var(--color-amber)]">Solicitação enviada</div>
              {period.expectedPayAt && (
                <div className="text-[10px] text-[var(--color-f4)] mt-0.5">
                  Pagamento previsto: {fmtDate(period.expectedPayAt)}
                </div>
              )}
            </div>
            <Link
              href="/transactions"
              className="text-[10px] text-[var(--color-cyan)] hover:underline no-underline whitespace-nowrap"
            >
              Ver transação →
            </Link>
          </div>
          <button
            onClick={handleReopen}
            disabled={isPending}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-medium text-[var(--color-f3)] bg-[var(--color-bg3)] border border-[var(--color-border2)] cursor-pointer hover:text-[var(--color-f1)] hover:border-[var(--color-border)] transition-all disabled:opacity-50"
          >
            <IconRefresh size={13} />
            {isPending ? "Reabrindo..." : "Reabrir Solicitação"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main PeriodDetail ─────────────────────────────────────────────────────────

const TABS = [
  { id: "routes",   label: "Trajetos",         icon: IconRoute },
  { id: "receipts", label: "Combustível",       icon: IconGasStation },
  { id: "expenses", label: "Despesas Extras",   icon: IconReceipt },
  { id: "summary",  label: "Resumo",            icon: IconFileText },
] as const;

type TabId = typeof TABS[number]["id"];

export function PeriodDetail({ period, config }: { period: KmPeriodDetail; config: KmConfigData }) {
  const [activeTab, setActiveTab] = useState<TabId>("routes");
  const isOpen = period.status === "open";

  return (
    <div className="p-8 max-w-[860px]">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/km-reimbursement"
          className="flex items-center gap-1.5 text-[11px] text-[var(--color-f4)] hover:text-[var(--color-f2)] mb-4 no-underline transition-colors w-fit"
        >
          <IconArrowLeft size={12} />
          Voltar para histórico
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-[family-name:var(--font-display)] italic text-[28px] font-bold tracking-tight text-[var(--color-f1)] leading-tight">
                {period.name}
              </h1>
              {!isOpen && (
                <span style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 999,
                  background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)",
                  color: "#FBBF24", fontWeight: 700, letterSpacing: 0.3,
                }}>
                  Enviado
                </span>
              )}
            </div>
            <div className="text-[12px] text-[var(--color-f4)]">
              {new Date(period.startDate).toLocaleDateString("pt-BR")} → {new Date(period.endDate).toLocaleDateString("pt-BR")}
              {" · "}
              {period.fuelType === "ethanol" ? "Etanol" : "Gasolina"}
              {period.notes && ` · ${period.notes}`}
            </div>
          </div>

          {/* Quick totals */}
          <div className="flex items-center gap-4 flex-shrink-0 mt-1">
            <div className="text-right">
              <div className="text-[10px] text-[var(--color-f4)] mb-0.5">Total</div>
              <div className="text-[22px] font-bold font-[family-name:var(--font-display)] italic text-[var(--color-f1)]">
                {period.grandTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
            </div>
            <Link
              href="/km-reimbursement/settings"
              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[var(--color-f4)] bg-[var(--color-bg3)] border border-[var(--color-border2)] hover:text-[var(--color-f2)] hover:border-[var(--color-border)] transition-all no-underline"
              title="Parâmetros"
            >
              <IconSettings size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-[var(--color-border)]">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 -mb-px transition-colors cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0",
              activeTab === id
                ? "text-[var(--color-cyan)] border-b-[var(--color-cyan)]"
                : "text-[var(--color-f4)] border-b-transparent hover:text-[var(--color-f2)]"
            )}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "routes"   && <RoutesTab period={period} />}
      {activeTab === "receipts" && <ReceiptsTab period={period} config={config} />}
      {activeTab === "expenses" && <ExpensesTab period={period} />}
      {activeTab === "summary"  && <SummaryTab period={period} config={config} />}
    </div>
  );
}

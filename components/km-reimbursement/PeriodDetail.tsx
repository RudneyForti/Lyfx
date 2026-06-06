"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  createKmRoute, updateKmRoute, deleteKmRoute,
  createKmReceipt, deleteKmReceipt,
  createKmExpense, deleteKmExpense,
  submitPeriod, reopenPeriod,
} from "@/app/actions/km-reimbursement";
import type {
  KmPeriodDetail, KmConfigData,
  KmRouteData, KmReceiptData, KmExpenseData,
  KmPlaceData,
} from "@/app/actions/km-reimbursement";
import { RouteMap } from "./RouteMap";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
import {
  IconArrowLeft, IconPlus, IconTrash, IconMap,
  IconRoute, IconGasStation, IconReceipt, IconFileText,
  IconClock, IconCheck, IconSend, IconRefresh,
  IconCopy, IconPencil, IconX, IconSettings, IconMapPin,
  IconTable, IconChevronLeft, IconChevronRight,
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
function fmtDateSAP(d: Date | string) {
  // dd.mm.yyyy for SAP
  const dt = new Date(d);
  const day = String(dt.getDate()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const year = dt.getFullYear();
  return `${day}.${month}.${year}`;
}
function fmtDayMonth(d: Date | string) {
  // DD/MM for SAP summary header
  const dt = new Date(d);
  const day = String(dt.getDate()).padStart(2, "0");
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
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
  toll:          "Pedágio",
  parking:       "Estacionamento",
  accommodation: "Hospedagem",
  food:          "Refeição",
  taxi:          "Taxi / Uber",
  other:         "Outro",
};

const EXPENSE_TYPE_OPTIONS = Object.entries(EXPENSE_TYPE_LABELS).map(([value, label]) => ({ value, label }));

const FUEL_TYPE_OPTIONS = [
  { value: "gasoline", label: "Gasolina" },
  { value: "ethanol",  label: "Etanol" },
];

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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center py-8 text-center border border-dashed border-[var(--color-border2)] rounded-[10px]">
      <span className="text-[12px] text-[var(--color-f4)]">Nenhum {label} registrado</span>
    </div>
  );
}

// ── Routes Tab ────────────────────────────────────────────────────────────────

function RouteForm({ periodId, route, places, onDone }: {
  periodId: string;
  route?: KmRouteData;
  places: KmPlaceData[];
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

  // Quando seleciona um lugar salvo, mostra botões Ida / Volta
  const [selectedPlace, setSelectedPlace] = useState<KmPlaceData | null>(null);

  function handlePlaceSelect(placeId: string) {
    const place = places.find(p => p.id === placeId);
    setSelectedPlace(place ?? null);
  }

  function applyIda() {
    if (!selectedPlace) return;
    setForm(f => ({
      ...f,
      origin: selectedPlace.originAddress,
      destination: selectedPlace.destinationAddress,
      km: selectedPlace.kmGoing > 0 ? String(selectedPlace.kmGoing) : f.km,
      notes: selectedPlace.name,
    }));
  }

  function applyVolta() {
    if (!selectedPlace) return;
    setForm(f => ({
      ...f,
      origin: selectedPlace.destinationAddress,
      destination: selectedPlace.originAddress,
      km: selectedPlace.kmReturn > 0 ? String(selectedPlace.kmReturn) : f.km,
      notes: selectedPlace.name,
    }));
  }

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

  const placesOptions = places.map(p => ({ value: p.id, label: p.name }));

  return (
    <div className="bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] p-4 mb-3">
      <form onSubmit={submit} className="flex flex-col gap-3">

        {/* Lugares salvos */}
        {!route && places.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--color-cyan)]">
              <IconMapPin size={10} />
              Lugar salvo
              <span className="text-[var(--color-f4)] font-normal">(preenche trajeto automaticamente)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={selectedPlace?.id ?? ""}
                  onChange={handlePlaceSelect}
                  options={placesOptions}
                  placeholder="Selecionar lugar cadastrado..."
                  height={34}
                  fontSize={12}
                />
              </div>
              {selectedPlace && (
                <>
                  <button
                    type="button"
                    onClick={applyIda}
                    className="flex items-center gap-1 px-3 h-[34px] rounded-[8px] text-[11px] font-semibold text-white cursor-pointer border-0 whitespace-nowrap"
                    style={{ background: "var(--color-cyan)" }}
                  >
                    Ida
                  </button>
                  <button
                    type="button"
                    onClick={applyVolta}
                    className="flex items-center gap-1 px-3 h-[34px] rounded-[8px] text-[11px] font-semibold cursor-pointer border whitespace-nowrap"
                    style={{ color: "var(--color-cyan)", borderColor: "var(--color-cyan-border)", background: "rgba(34,211,238,0.08)" }}
                  >
                    Volta
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label>Data</Label>
            <DatePicker
              value={form.date}
              onChange={v => setForm(f => ({ ...f, date: v }))}
              height={34}
              fontSize={12}
            />
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
          <Label>Empresa / Descrição <span className="text-[var(--color-f4)] font-normal">(opcional)</span></Label>
          <input className={inputCls()} placeholder="Ex: Empresa XYZ, Reunião com cliente..." value={form.notes} onChange={set("notes")} />
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

function RoutesTab({ period, places }: { period: KmPeriodDetail; places: KmPlaceData[] }) {
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

      {adding && <RouteForm periodId={period.id} places={places} onDone={() => setAdding(false)} />}

      {period.routes.length === 0 && !adding && <EmptyState label="trajeto" />}

      {period.routes.length > 0 && (
        <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] overflow-hidden">
          {period.routes.map(r => editing === r.id ? (
            <div key={r.id} className="p-3 border-b border-[var(--color-border)] last:border-0">
              <RouteForm periodId={period.id} route={r} places={places} onDone={() => setEditing(null)} />
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
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
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
            <DatePicker
              value={form.date}
              onChange={v => setForm(f => ({ ...f, date: v }))}
              height={34}
              fontSize={12}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Combustível</Label>
            <Select
              value={form.fuelType}
              onChange={v => setForm(f => ({ ...f, fuelType: v }))}
              options={FUEL_TYPE_OPTIONS}
              height={34}
              fontSize={12}
            />
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

      {period.receipts.length > 0 && (
        <div className="mt-3 p-3 bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[10px] flex flex-col gap-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-[var(--color-f4)]">Preço médio/litro</span>
            <span className="font-medium text-[var(--color-f1)]">R$ {period.fuelPriceAvg.toFixed(3)}</span>
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
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
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
            <DatePicker
              value={form.date}
              onChange={v => setForm(f => ({ ...f, date: v }))}
              height={34}
              fontSize={12}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Tipo</Label>
            <Select
              value={form.type}
              onChange={v => setForm(f => ({ ...f, type: v }))}
              options={EXPENSE_TYPE_OPTIONS}
              height={34}
              fontSize={12}
            />
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

// ── SAP Table ─────────────────────────────────────────────────────────────────

const SAP_CHUNK = 5;

function SapTable({ routes, config }: { routes: KmRouteData[]; config: KmConfigData }) {
  const [chunk, setChunk] = useState(0);
  const [copied, setCopied] = useState(false);

  const totalChunks = Math.ceil(routes.length / SAP_CHUNK);
  const start = chunk * SAP_CHUNK;
  const slice = routes.slice(start, start + SAP_CHUNK);

  const colLabels = ["Data", "KM", "Placa", "Tipo", "Classe", "Marca", "Local Partida", "Destino Final"];

  function buildTSV(rows: KmRouteData[]): string {
    return rows.map(r => [
      fmtDateSAP(r.date),
      r.km.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
      config.vehiclePlate,
      config.vehicleType,
      config.vehicleClass,
      config.vehicleBrand,
      r.origin,
      r.destination,
    ].join("\t")).join("\n");
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildTSV(slice)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (routes.length === 0) {
    return (
      <div className="flex flex-col items-center py-6 border border-dashed border-[var(--color-border2)] rounded-[10px]">
        <span className="text-[12px] text-[var(--color-f4)]">Nenhum trajeto para exibir</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">Lote SAP</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[var(--color-bg3)] text-[var(--color-f4)] border border-[var(--color-border2)]">
            {start + 1}–{Math.min(start + SAP_CHUNK, routes.length)} de {routes.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setChunk(c => Math.max(0, c - 1))}
            disabled={chunk === 0}
            className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[var(--color-f4)] bg-[var(--color-bg3)] border border-[var(--color-border2)] hover:text-[var(--color-f2)] disabled:opacity-30 cursor-pointer transition-colors"
          >
            <IconChevronLeft size={12} />
          </button>
          <span className="text-[10px] text-[var(--color-f4)]">{chunk + 1}/{totalChunks}</span>
          <button
            type="button"
            onClick={() => setChunk(c => Math.min(totalChunks - 1, c + 1))}
            disabled={chunk >= totalChunks - 1}
            className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[var(--color-f4)] bg-[var(--color-bg3)] border border-[var(--color-border2)] hover:text-[var(--color-f2)] disabled:opacity-30 cursor-pointer transition-colors"
          >
            <IconChevronRight size={12} />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[11px] font-medium cursor-pointer border transition-all"
            style={copied
              ? { color: "#22c55e", background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)" }
              : { color: "var(--color-f3)", background: "var(--color-bg3)", borderColor: "var(--color-border2)" }}
          >
            {copied ? <IconCheck size={11} /> : <IconCopy size={11} />}
            {copied ? "Copiado!" : "Copiar lote"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[12px] border border-[var(--color-border)]">
        <table className="w-full border-collapse" style={{ minWidth: 720 }}>
          <thead>
            <tr style={{ background: "var(--color-bg3)" }}>
              {colLabels.map(col => (
                <th key={col} className="text-left px-3 py-2 text-[9px] font-bold tracking-[1.4px] uppercase text-[var(--color-f4)] border-b border-[var(--color-border)] whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {routes.map((r, i) => {
              const inChunk = i >= start && i < start + SAP_CHUNK;
              return (
                <tr
                  key={r.id}
                  className={cn(
                    "border-b border-[var(--color-border)] last:border-0 transition-colors",
                    inChunk ? "bg-[rgba(34,211,238,0.04)]" : ""
                  )}
                >
                  <td className="px-3 py-2 text-[11px] text-[var(--color-f2)] whitespace-nowrap font-mono">{fmtDateSAP(r.date)}</td>
                  <td className="px-3 py-2 text-[11px] text-[var(--color-cyan)] font-medium whitespace-nowrap">
                    {r.km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-[var(--color-f3)] whitespace-nowrap">{config.vehiclePlate || "—"}</td>
                  <td className="px-3 py-2 text-[11px] text-[var(--color-f3)] whitespace-nowrap">{config.vehicleType || "—"}</td>
                  <td className="px-3 py-2 text-[11px] text-[var(--color-f3)] whitespace-nowrap">{config.vehicleClass || "—"}</td>
                  <td className="px-3 py-2 text-[11px] text-[var(--color-f3)] whitespace-nowrap">{config.vehicleBrand || "—"}</td>
                  <td className="px-3 py-2 text-[11px] text-[var(--color-f2)] max-w-[160px] truncate">{r.origin}</td>
                  <td className="px-3 py-2 text-[11px] text-[var(--color-f2)] max-w-[160px] truncate">{r.destination}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!config.vehiclePlate && (
        <div className="text-[10px] text-[var(--color-f4)] flex items-center gap-1.5">
          <span className="text-[var(--color-amber)]">!</span>
          Placa, tipo e marca do veículo não configurados.{" "}
          <Link href="/km-reimbursement/settings" className="text-[var(--color-cyan)] hover:underline no-underline">
            Configurar →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Summary Tab ───────────────────────────────────────────────────────────────

function SummaryTab({ period, config }: { period: KmPeriodDetail; config: KmConfigData }) {
  const [isPending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"text" | "table">("text");

  const isOpen = period.status === "open";
  const totalFuelAmount = period.receipts.reduce((s, r) => s + r.totalAmount, 0);
  const minRequired = period.kmAmount * config.minFuelPct;
  const fuelOk = totalFuelAmount >= minRequired;
  const canSubmit = isOpen && period.totalKm > 0 && fuelOk;

  const byType = period.expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + e.amount;
    return acc;
  }, {});

  // Determine dominant fuelType from receipts
  const gasolineL = period.receipts.filter(r => r.fuelType === "gasoline").reduce((s, r) => s + r.liters, 0);
  const ethanolL  = period.receipts.filter(r => r.fuelType === "ethanol").reduce((s, r) => s + r.liters, 0);
  const dominantFuel = ethanolL > gasolineL ? "ethanol" : "gasoline";
  const fuelLabel = dominantFuel === "ethanol" ? "Etanol" : "Gasolina";
  const taxaPct = dominantFuel === "ethanol"
    ? (config.ethanolRate * 100).toFixed(0)
    : (config.gasolineRate * 100).toFixed(0);

  // Build SAP text: routes first (grouped by day/company), then calculations
  const routeLines: string[] = [];
  for (const r of period.routes) {
    const dayMonth = fmtDayMonth(r.date);
    const empresa = r.notes ? ` — ${r.notes}` : "";
    routeLines.push(`${dayMonth}${empresa}`);
    routeLines.push(`${r.origin} → ${r.destination} (${r.km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km)`);
    routeLines.push(""); // blank line between routes
  }

  const calcLines = [
    "─────────────────────────────",
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

  const summaryLines = [...routeLines, ...calcLines];
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
      {/* View toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1 bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[10px] p-0.5">
          <button
            onClick={() => setView("text")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-medium cursor-pointer border-0 transition-colors",
              view === "text" ? "bg-[var(--color-bg4)] text-[var(--color-f1)]" : "bg-transparent text-[var(--color-f4)] hover:text-[var(--color-f2)]"
            )}
          >
            <IconFileText size={11} />
            Texto SAP
          </button>
          <button
            onClick={() => setView("table")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-medium cursor-pointer border-0 transition-colors",
              view === "table" ? "bg-[var(--color-bg4)] text-[var(--color-f1)]" : "bg-transparent text-[var(--color-f4)] hover:text-[var(--color-f2)]"
            )}
          >
            <IconTable size={11} />
            Tabela SAP
          </button>
        </div>

        {view === "text" && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[11px] font-medium cursor-pointer border transition-all"
            style={copied
              ? { color: "#22c55e", background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)" }
              : { color: "var(--color-f3)", background: "var(--color-bg3)", borderColor: "var(--color-border2)" }}
          >
            {copied ? <IconCheck size={11} /> : <IconCopy size={11} />}
            {copied ? "Copiado!" : "Copiar texto"}
          </button>
        )}
      </div>

      {/* Text view */}
      {view === "text" && (
        <div className="bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] p-4 mb-4 font-mono text-[12px] leading-relaxed text-[var(--color-f2)] whitespace-pre-wrap select-all">
          {summaryText}
        </div>
      )}

      {/* Table view */}
      {view === "table" && (
        <div className="mb-4">
          <SapTable routes={period.routes} config={config} />
        </div>
      )}

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
  { id: "routes",   label: "Trajetos",       icon: IconRoute },
  { id: "receipts", label: "Combustível",     icon: IconGasStation },
  { id: "expenses", label: "Despesas Extras", icon: IconReceipt },
  { id: "summary",  label: "Resumo",          icon: IconFileText },
] as const;

type TabId = typeof TABS[number]["id"];

export function PeriodDetail({
  period,
  config,
  places,
}: {
  period: KmPeriodDetail;
  config: KmConfigData;
  places: KmPlaceData[];
}) {
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
            </div>
          </div>

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
      {activeTab === "routes"   && <RoutesTab period={period} places={places} />}
      {activeTab === "receipts" && <ReceiptsTab period={period} config={config} />}
      {activeTab === "expenses" && <ExpensesTab period={period} />}
      {activeTab === "summary"  && <SummaryTab period={period} config={config} />}
    </div>
  );
}

"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import {
  createKmRoute, createKmRoutesBulk, updateKmRoute, deleteKmRoute,
  createKmReceipt, updateKmReceipt, deleteKmReceipt,
  createKmExpense, deleteKmExpense,
  updateKmPeriod, submitPeriod, reopenPeriod,
} from "@/app/actions/km-reimbursement";
import type {
  KmPeriodDetail, KmConfigData,
  KmRouteData, KmReceiptData, KmExpenseData,
  KmPlaceData,
} from "@/app/actions/km-reimbursement";
import { RouteMap } from "./RouteMap";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { PlacesModal } from "./PlacesModal";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
import {
  IconArrowLeft, IconPlus, IconTrash, IconMap,
  IconRoute, IconGasStation, IconReceipt, IconFileText,
  IconClock, IconCheck, IconSend, IconRefresh,
  IconCopy, IconPencil, IconX, IconSettings, IconMapPin,
  IconTable, IconArrowRight, IconArrowLeft as IconBack,
  IconDownload, IconArrowsLeftRight,
} from "@tabler/icons-react";
import { extractPolyline } from "@/lib/km-static-map";
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
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,"0")}.${String(dt.getMonth()+1).padStart(2,"0")}.${dt.getFullYear()}`;
}
function fmtDayMonth(d: Date | string) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}`;
}
function fmtWeekday(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR", { weekday: "short" });
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

// ── Direction badge ───────────────────────────────────────────────────────────

function DirectionBadge({ direction }: { direction: string | null }) {
  if (!direction) return null;
  const isGoing = direction === "going";
  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded-[4px] font-semibold flex-shrink-0"
      style={{
        background: isGoing ? "rgba(34,211,238,0.1)" : "rgba(167,139,250,0.1)",
        border: `1px solid ${isGoing ? "rgba(34,211,238,0.25)" : "rgba(167,139,250,0.25)"}`,
        color: isGoing ? "var(--color-cyan)" : "#a78bfa",
      }}
    >
      {isGoing ? "Ida" : "Volta"}
    </span>
  );
}

// ── Route Form ────────────────────────────────────────────────────────────────

function RouteForm({ periodId, route, places, onDone, prefill }: {
  periodId: string;
  route?: KmRouteData;
  places: KmPlaceData[];
  onDone: () => void;
  /** Pre-fill de endereços (botão "+ Volta") */
  prefill?: { origin: string; destination: string; date: string };
}) {
  const [isPending, start] = useTransition();
  const [showMap, setShowMap] = useState(false);
  const [mapDirections, setMapDirections] = useState<google.maps.DirectionsResult | null>(null);
  // Se veio de prefill, força modo manual
  const [mode, setMode] = useState<"place" | "manual">(
    prefill ? "manual" : (places.length > 0 && !route ? "place" : "manual")
  );
  const [selectedPlace, setSelectedPlace] = useState<KmPlaceData | null>(null);
  // ida+volta checkboxes (only in place mode, new route)
  const [dirGoing, setDirGoing] = useState(true);
  const [dirReturn, setDirReturn] = useState(false);

  const [form, setForm] = useState({
    date:         route ? fmtDateInput(route.date) : (prefill?.date ?? today()),
    origin:       route?.origin      ?? prefill?.origin      ?? "",
    destination:  route?.destination ?? prefill?.destination ?? "",
    km:           route?.km != null ? String(route.km) : "",
    routePolyline: route?.routePolyline ?? null as string | null,
    notes:        route?.notes ?? "",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  // Callback do mapa: extrai km E polyline do resultado
  function handleMapDirections(result: google.maps.DirectionsResult) {
    setMapDirections(result);
    const leg = result.routes?.[0]?.legs?.[0];
    if (leg?.distance?.value) {
      const km = Math.round((leg.distance.value / 1000) * 10) / 10;
      setForm(f => ({ ...f, km: String(km), routePolyline: extractPolyline(result) }));
    }
  }

  // Clear saved directions whenever origin/destination change
  const prevRouteAddr = useRef({ o: form.origin, d: form.destination });
  useEffect(() => {
    const p = prevRouteAddr.current;
    if (p.o !== form.origin || p.d !== form.destination) {
      setMapDirections(null);
      prevRouteAddr.current = { o: form.origin, d: form.destination };
    }
  }, [form.origin, form.destination]);

  const placesOptions = places.map(p => ({ value: p.id, label: p.name }));

  function handlePlaceSelect(placeId: string) {
    const place = places.find(p => p.id === placeId);
    setSelectedPlace(place ?? null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      if (route) {
        // Edit mode — always manual update
        await updateKmRoute(route.id, {
          date: form.date,
          origin: form.origin.trim(),
          destination: form.destination.trim(),
          km: parseFloat(form.km) || 0,
          routePolyline: form.routePolyline ?? undefined,
          notes: form.notes.trim() || undefined,
        });
      } else if (mode === "place" && selectedPlace) {
        // Place mode — create one or two routes; extrai polyline do lugar salvo
        const routesToCreate = [];
        if (dirGoing) {
          routesToCreate.push({
            periodId,
            date: form.date,
            origin: selectedPlace.originAddress,
            destination: selectedPlace.destinationAddress,
            km: selectedPlace.kmGoing,
            routePolyline: extractPolyline(selectedPlace.routeGoing) ?? undefined,
            notes: selectedPlace.name,
            placeId: selectedPlace.id,
            direction: "going",
          });
        }
        if (dirReturn) {
          routesToCreate.push({
            periodId,
            date: form.date,
            origin: selectedPlace.destinationAddress,
            destination: selectedPlace.originAddress,
            km: selectedPlace.kmReturn,
            routePolyline: extractPolyline(selectedPlace.routeReturn) ?? undefined,
            notes: selectedPlace.name,
            placeId: selectedPlace.id,
            direction: "return",
          });
        }
        if (routesToCreate.length > 0) {
          await createKmRoutesBulk(routesToCreate);
        }
      } else {
        // Manual mode — km sempre vem do mapa
        await createKmRoute({
          periodId,
          date: form.date,
          origin: form.origin.trim(),
          destination: form.destination.trim(),
          km: parseFloat(form.km) || 0,
          routePolyline: form.routePolyline ?? undefined,
          notes: form.notes.trim() || undefined,
        });
      }
      onDone();
    });
  }

  const isEditing = !!route;

  return (
    <div className="bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] p-4 mb-3">
      {/* Mode toggle (only for new route) */}
      {!isEditing && places.length > 0 && (
        <div className="flex items-center gap-1 mb-3 bg-[var(--color-bg4)] border border-[var(--color-border2)] rounded-[8px] p-0.5 w-fit">
          {(["place", "manual"] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setSelectedPlace(null); }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[10px] font-medium cursor-pointer border-0 transition-colors",
                mode === m ? "bg-[var(--color-bg3)] text-[var(--color-f1)]" : "bg-transparent text-[var(--color-f4)] hover:text-[var(--color-f2)]"
              )}
            >
              {m === "place" ? <><IconMapPin size={10} /> Lugar cadastrado</> : <><IconMap size={10} /> Manual</>}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-3">

        {/* PLACE MODE */}
        {!isEditing && mode === "place" && (
          <>
            {/* Place selector */}
            <div className="flex flex-col gap-1">
              <Label>Lugar</Label>
              <Select
                value={selectedPlace?.id ?? ""}
                onChange={handlePlaceSelect}
                options={placesOptions}
                placeholder="Selecionar lugar..."
                height={34}
                fontSize={12}
              />
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1">
              <Label>Data</Label>
              <div className="max-w-[180px]">
                <DatePicker value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} height={34} fontSize={12} />
              </div>
            </div>

            {/* Ida / Volta checkboxes */}
            {selectedPlace && (
              <div className="flex flex-col gap-2">
                <Label>Deslocamentos</Label>
                <div className="flex flex-col gap-2">
                  {/* Ida */}
                  <label className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-[10px] border cursor-pointer transition-all",
                    dirGoing
                      ? "bg-[rgba(34,211,238,0.06)] border-[rgba(34,211,238,0.25)]"
                      : "bg-[var(--color-bg4)] border-[var(--color-border2)] opacity-60"
                  )}>
                    <input
                      type="checkbox"
                      checked={dirGoing}
                      onChange={e => setDirGoing(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[var(--color-cyan)] cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <DirectionBadge direction="going" />
                        <span className="text-[11px] font-medium text-[var(--color-f1)]">{selectedPlace.name}</span>
                        <span className="text-[10px] text-[var(--color-cyan)] font-medium ml-auto">
                          {selectedPlace.kmGoing.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
                        </span>
                      </div>
                      {selectedPlace.originAddress && (
                        <div className="text-[10px] text-[var(--color-f4)] mt-0.5 truncate flex items-center gap-1">
                          {selectedPlace.originAddress}
                          <IconArrowRight size={8} className="flex-shrink-0" />
                          {selectedPlace.destinationAddress}
                        </div>
                      )}
                    </div>
                  </label>
                  {/* Volta */}
                  <label className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-[10px] border cursor-pointer transition-all",
                    dirReturn
                      ? "bg-[rgba(167,139,250,0.06)] border-[rgba(167,139,250,0.25)]"
                      : "bg-[var(--color-bg4)] border-[var(--color-border2)] opacity-60"
                  )}>
                    <input
                      type="checkbox"
                      checked={dirReturn}
                      onChange={e => setDirReturn(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[#a78bfa] cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <DirectionBadge direction="return" />
                        <span className="text-[11px] font-medium text-[var(--color-f1)]">{selectedPlace.name}</span>
                        <span className="text-[10px] font-medium ml-auto" style={{ color: "#a78bfa" }}>
                          {selectedPlace.kmReturn.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
                        </span>
                      </div>
                      {selectedPlace.destinationAddress && (
                        <div className="text-[10px] text-[var(--color-f4)] mt-0.5 truncate flex items-center gap-1">
                          {selectedPlace.destinationAddress}
                          <IconArrowRight size={8} className="flex-shrink-0" />
                          {selectedPlace.originAddress}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            )}
          </>
        )}

        {/* MANUAL MODE (or editing) */}
        {(isEditing || mode === "manual") && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label>Data</Label>
                <DatePicker value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} height={34} fontSize={12} />
              </div>
              {/* KM — somente leitura, calculado pelo mapa */}
              <div className="flex flex-col gap-1">
                <Label>KM calculado</Label>
                <div
                  className={inputCls("cursor-default select-none")}
                  style={{
                    background: "var(--color-bg2)",
                    color: form.km ? "var(--color-cyan)" : "var(--color-f4)",
                    fontWeight: form.km ? 600 : 400,
                  }}
                >
                  {form.km
                    ? `${Number(form.km).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`
                    : "Abra o mapa →"}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label>Origem</Label>
                <AddressAutocomplete
                  className={inputCls()}
                  placeholder="Rua, cidade..."
                  value={form.origin}
                  onChange={val => setForm(f => ({ ...f, origin: val, km: "", routePolyline: null }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Destino</Label>
                <AddressAutocomplete
                  className={inputCls()}
                  placeholder="Rua, cidade..."
                  value={form.destination}
                  onChange={val => setForm(f => ({ ...f, destination: val, km: "", routePolyline: null }))}
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Empresa / Descrição <span className="text-[var(--color-f4)] font-normal">(opcional)</span></Label>
              <input className={inputCls()} placeholder="Ex: Empresa XYZ..." value={form.notes} onChange={set("notes")} />
            </div>
            {(form.origin || form.destination) && (
              <button type="button" onClick={() => setShowMap(v => !v)}
                className="flex items-center gap-1.5 text-[11px] w-fit cursor-pointer bg-transparent border-0 p-0 hover:opacity-80 transition-opacity"
                style={{ color: !form.km ? "var(--color-cyan)" : "var(--color-f4)" }}
              >
                <IconMap size={12} />
                {showMap ? "Ocultar mapa" : (form.km ? "Ver / editar no mapa" : "Calcular km no mapa")}
              </button>
            )}
            {showMap && (
              <div className="h-[340px] rounded-[12px] overflow-hidden">
                <RouteMap
                  origin={form.origin}
                  destination={form.destination}
                  initialDirections={mapDirections}
                  onDirectionsChange={handleMapDirections}
                />
              </div>
            )}
          </>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={
              isPending ||
              (mode === "place" && !selectedPlace) ||
              (mode === "place" && !dirGoing && !dirReturn) ||
              ((isEditing || mode === "manual") && !form.km)
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold text-white cursor-pointer border-0 disabled:opacity-50"
            style={{ background: "var(--color-cyan)" }}
          >
            <IconCheck size={12} />
            {isPending ? "Salvando..." : isEditing ? "Salvar" : "Adicionar"}
          </button>
          <button type="button" onClick={onDone}
            className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[11px] text-[var(--color-f3)] bg-[var(--color-bg4)] border border-[var(--color-border2)] cursor-pointer hover:text-[var(--color-f1)] transition-colors">
            <IconX size={11} />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Routes Tab (grouped by day) ───────────────────────────────────────────────

function RoutesTab({ period, places }: { period: KmPeriodDetail; places: KmPlaceData[] }) {
  const isOpen = period.status === "open";
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [voltaPrefill, setVoltaPrefill] = useState<{ origin: string; destination: string; date: string } | null>(null);
  const [, startDel] = useTransition();

  // Group routes by date key
  const grouped: Record<string, KmRouteData[]> = {};
  for (const r of period.routes) {
    const key = new Date(r.date).toISOString().split("T")[0];
    (grouped[key] ??= []).push(r);
  }
  const days = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div>
      {isOpen && <SectionHeader label="Trajetos" count={period.routes.length} onAdd={() => { setAdding(true); setEditing(null); }} />}
      {!isOpen && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">Trajetos</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[var(--color-bg3)] text-[var(--color-f4)] border border-[var(--color-border2)]">{period.routes.length}</span>
        </div>
      )}

      {adding && (
        <RouteForm
          periodId={period.id}
          places={places}
          prefill={voltaPrefill ?? undefined}
          onDone={() => { setAdding(false); setVoltaPrefill(null); }}
        />
      )}

      {period.routes.length === 0 && !adding && <EmptyState label="trajeto" />}

      {/* Days */}
      {days.map(([dateKey, routes]) => {
        const dateObj = new Date(dateKey + "T12:00:00");
        const weekday = fmtWeekday(dateObj);
        const dayMonth = fmtDayMonth(dateObj);
        const kmDay = routes.reduce((s, r) => s + r.km, 0);

        return (
          <div key={dateKey} className="mb-4">
            {/* Day header */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className="text-[9px] font-bold tracking-[1.5px] uppercase text-[var(--color-f4)]">
                {weekday}, {dayMonth}
              </div>
              <div className="flex-1 h-px bg-[var(--color-border)]" />
              <span className="text-[9px] text-[var(--color-f4)]">
                {kmDay.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
              </span>
            </div>

            {/* Routes for this day */}
            <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] overflow-hidden">
              {routes.map(r => (
                editing === r.id ? (
                  <div key={r.id} className="p-3 border-b border-[var(--color-border)] last:border-0">
                    <RouteForm periodId={period.id} route={r} places={places} onDone={() => setEditing(null)} />
                  </div>
                ) : (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] last:border-0 group">
                    <div className="flex-1 min-w-0">
                      {r.placeId ? (
                        // Place-based route — compact display
                        <div className="flex items-center gap-2 flex-wrap">
                          <DirectionBadge direction={r.direction} />
                          <span className="text-[12px] font-medium text-[var(--color-f1)] truncate">
                            {r.notes ?? `${r.origin} → ${r.destination}`}
                          </span>
                        </div>
                      ) : (
                        // Manual route
                        <div className="text-[12px] font-medium text-[var(--color-f1)] truncate">
                          {r.origin} → {r.destination}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-[var(--color-cyan)] font-medium">
                          {r.km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
                        </span>
                        {!r.placeId && r.notes && (
                          <span className="text-[10px] text-[var(--color-f4)] truncate max-w-[200px]">{r.notes}</span>
                        )}
                        {r.placeId && (
                          <span className="text-[10px] text-[var(--color-f4)] truncate max-w-[240px]">
                            {r.origin} → {r.destination}
                          </span>
                        )}
                      </div>
                    </div>
                    {isOpen && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* + Volta — cria trajeto inverso */}
                        <button
                          onClick={() => {
                            setVoltaPrefill({ origin: r.destination, destination: r.origin, date: fmtDateInput(r.date) });
                            setAdding(true);
                            setEditing(null);
                          }}
                          title="Adicionar volta"
                          className="flex items-center gap-0.5 h-6 px-1.5 rounded-[6px] text-[9px] font-medium text-[var(--color-f4)] hover:text-[#a78bfa] hover:bg-[rgba(167,139,250,0.1)] cursor-pointer border-0 bg-transparent transition-colors">
                          <IconArrowsLeftRight size={10} />
                          Volta
                        </button>
                        <button onClick={() => setEditing(r.id)}
                          className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[var(--color-f4)] hover:text-[var(--color-f2)] hover:bg-[var(--color-bg4)] cursor-pointer border-0 bg-transparent transition-colors">
                          <IconPencil size={11} />
                        </button>
                        <button
                          onClick={() => { if (!confirm("Excluir trajeto?")) return; startDel(() => deleteKmRoute(r.id)); }}
                          className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[var(--color-f4)] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] cursor-pointer border-0 bg-transparent transition-colors">
                          <IconTrash size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>
          </div>
        );
      })}

      {period.routes.length > 0 && (
        <div className="flex justify-end mt-1">
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

function ReceiptForm({ periodId, receipt, onDone }: {
  periodId: string;
  receipt?: KmReceiptData;
  onDone: () => void;
}) {
  const [isPending, start] = useTransition();
  const [form, setForm] = useState({
    date: receipt ? fmtDateInput(receipt.date) : today(),
    fuelType: receipt?.fuelType ?? "gasoline",
    liters: receipt ? String(receipt.liters) : "",
    totalAmount: receipt ? String(receipt.totalAmount) : "",
    notes: receipt?.notes ?? "",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const isEditing = !!receipt;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      if (isEditing) {
        await updateKmReceipt(receipt.id, {
          date: form.date,
          fuelType: form.fuelType,
          liters: parseFloat(form.liters) || 0,
          totalAmount: parseFloat(form.totalAmount) || 0,
          notes: form.notes.trim() || undefined,
        });
      } else {
        await createKmReceipt({
          periodId, date: form.date, fuelType: form.fuelType,
          liters: parseFloat(form.liters) || 0,
          totalAmount: parseFloat(form.totalAmount) || 0,
          notes: form.notes.trim() || undefined,
        });
      }
      onDone();
    });
  }

  const pricePerLiter = form.liters && form.totalAmount
    ? (parseFloat(form.totalAmount) / parseFloat(form.liters)).toFixed(3) : null;

  return (
    <div className="bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] p-4 mb-3">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1"><Label>Data</Label>
            <DatePicker value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} height={34} fontSize={12} />
          </div>
          <div className="flex flex-col gap-1"><Label>Combustível</Label>
            <Select value={form.fuelType} onChange={v => setForm(f => ({ ...f, fuelType: v }))} options={FUEL_TYPE_OPTIONS} height={34} fontSize={12} />
          </div>
          <div className="flex flex-col gap-1"><Label>Litros</Label>
            <input type="number" step="0.001" min="0" className={inputCls()} placeholder="0.000" value={form.liters} onChange={set("liters")} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1"><Label>Valor total (R$)</Label>
            <input type="number" step="0.01" min="0" className={inputCls()} placeholder="0.00" value={form.totalAmount} onChange={set("totalAmount")} required />
          </div>
          <div className="flex flex-col gap-1"><Label>Observações <span className="text-[var(--color-f4)] font-normal">(opcional)</span></Label>
            <input className={inputCls()} placeholder="Posto, cidade..." value={form.notes} onChange={set("notes")} />
          </div>
        </div>
        {pricePerLiter && (
          <div className="text-[10px] text-[var(--color-f4)]">
            Preço por litro: <span className="font-medium text-[var(--color-cyan)]">R$ {pricePerLiter}</span>
          </div>
        )}
        <div className="flex items-center gap-2 pt-1">
          <button type="submit" disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold text-white cursor-pointer border-0 disabled:opacity-50"
            style={{ background: "var(--color-cyan)" }}>
            <IconCheck size={12} />{isPending ? "Salvando..." : isEditing ? "Salvar" : "Adicionar"}
          </button>
          <button type="button" onClick={onDone}
            className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[11px] text-[var(--color-f3)] bg-[var(--color-bg4)] border border-[var(--color-border2)] cursor-pointer hover:text-[var(--color-f1)] transition-colors">
            <IconX size={11} />Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function ReceiptsTab({ period, config }: { period: KmPeriodDetail; config: KmConfigData }) {
  const isOpen = period.status === "open";
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [, startDel] = useTransition();
  const totalFuelAmount = period.receipts.reduce((s, r) => s + r.totalAmount, 0);
  const minRequired = period.kmAmount * config.minFuelPct;
  const fuelOk = totalFuelAmount >= minRequired;

  return (
    <div>
      {isOpen && (
        <SectionHeader
          label="Notas de Combustível"
          count={period.receipts.length}
          onAdd={() => { setAdding(true); setEditing(null); }}
        />
      )}
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
          {period.receipts.map(r =>
            editing === r.id ? (
              <div key={r.id} className="p-3 border-b border-[var(--color-border)] last:border-0">
                <ReceiptForm
                  periodId={period.id}
                  receipt={r}
                  onDone={() => setEditing(null)}
                />
              </div>
            ) : (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] last:border-0 group">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-[var(--color-f1)]">
                    {r.fuelType === "ethanol" ? "Etanol" : "Gasolina"} · {r.liters.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} L
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-[var(--color-f4)]">{fmtDate(r.date)}</span>
                    <span className="text-[10px] text-[var(--color-f4)]">R$ {(r.totalAmount / r.liters).toFixed(3)}/litro</span>
                    {r.notes && <span className="text-[10px] text-[var(--color-f4)] truncate">{r.notes}</span>}
                  </div>
                </div>
                <div className="text-[13px] font-semibold text-[var(--color-f1)]">{fmt(r.totalAmount)}</div>
                {isOpen && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setAdding(false); setEditing(r.id); }}
                      className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[var(--color-f4)] hover:text-[var(--color-f2)] hover:bg-[var(--color-bg4)] cursor-pointer border-0 bg-transparent transition-colors"
                      title="Editar">
                      <IconPencil size={11} />
                    </button>
                    <button
                      onClick={() => { if (!confirm("Excluir nota?")) return; startDel(() => deleteKmReceipt(r.id)); }}
                      className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[var(--color-f4)] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] cursor-pointer border-0 bg-transparent transition-colors"
                      title="Excluir">
                      <IconTrash size={11} />
                    </button>
                  </div>
                )}
              </div>
            )
          )}
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
  const [form, setForm] = useState({ date: today(), type: "toll", amount: "", notes: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      await createKmExpense({ periodId, date: form.date, type: form.type, amount: parseFloat(form.amount) || 0, notes: form.notes.trim() || undefined });
      onDone();
    });
  }

  return (
    <div className="bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] p-4 mb-3">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1"><Label>Data</Label><DatePicker value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} height={34} fontSize={12} /></div>
          <div className="flex flex-col gap-1"><Label>Tipo</Label><Select value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={EXPENSE_TYPE_OPTIONS} height={34} fontSize={12} /></div>
          <div className="flex flex-col gap-1"><Label>Valor (R$)</Label><input type="number" step="0.01" min="0" className={inputCls()} placeholder="0.00" value={form.amount} onChange={set("amount")} required /></div>
        </div>
        <div className="flex flex-col gap-1"><Label>Observações <span className="text-[var(--color-f4)] font-normal">(opcional)</span></Label><input className={inputCls()} placeholder="Detalhes..." value={form.notes} onChange={set("notes")} /></div>
        <div className="flex items-center gap-2 pt-1">
          <button type="submit" disabled={isPending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold text-white cursor-pointer border-0 disabled:opacity-50" style={{ background: "var(--color-cyan)" }}><IconCheck size={12} />{isPending ? "Salvando..." : "Adicionar"}</button>
          <button type="button" onClick={onDone} className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[11px] text-[var(--color-f3)] bg-[var(--color-bg4)] border border-[var(--color-border2)] cursor-pointer hover:text-[var(--color-f1)] transition-colors"><IconX size={11} />Cancelar</button>
        </div>
      </form>
    </div>
  );
}

function ExpensesTab({ period }: { period: KmPeriodDetail }) {
  const isOpen = period.status === "open";
  const [adding, setAdding] = useState(false);
  const [, startDel] = useTransition();
  const byType = period.expenses.reduce<Record<string, number>>((acc, e) => { acc[e.type] = (acc[e.type] ?? 0) + e.amount; return acc; }, {});

  return (
    <div>
      {isOpen && <SectionHeader label="Despesas Extras" count={period.expenses.length} onAdd={() => setAdding(true)} />}
      {!isOpen && <div className="flex items-center gap-2 mb-3"><span className="text-[10px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">Despesas Extras</span><span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[var(--color-bg3)] text-[var(--color-f4)] border border-[var(--color-border2)]">{period.expenses.length}</span></div>}
      {adding && <ExpenseForm periodId={period.id} onDone={() => setAdding(false)} />}
      {period.expenses.length === 0 && !adding && <EmptyState label="despesa extra" />}
      {period.expenses.length > 0 && (
        <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] overflow-hidden">
          {period.expenses.map(e => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] last:border-0 group">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-[var(--color-f1)]">{EXPENSE_TYPE_LABELS[e.type] ?? e.type}</div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-[var(--color-f4)]">{fmtDate(e.date)}</span>
                  {e.notes && <span className="text-[10px] text-[var(--color-f4)] truncate">{e.notes}</span>}
                </div>
              </div>
              <div className="text-[13px] font-semibold text-[var(--color-f1)]">{fmt(e.amount)}</div>
              {isOpen && (
                <button onClick={() => { if (!confirm("Excluir despesa?")) return; startDel(() => deleteKmExpense(e.id)); }}
                  className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[var(--color-f4)] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] cursor-pointer border-0 bg-transparent transition-colors opacity-0 group-hover:opacity-100">
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
            <div key={type} className="flex justify-between text-[11px]"><span className="text-[var(--color-f4)]">{EXPENSE_TYPE_LABELS[type] ?? type}</span><span className="font-medium text-[var(--color-f1)]">{fmt(total)}</span></div>
          ))}
          <div className="flex justify-between text-[11px] pt-1 border-t border-[var(--color-border2)]"><span className="text-[var(--color-f4)]">Total</span><span className="font-semibold text-[var(--color-f1)]">{fmt(period.extraAmount)}</span></div>
        </div>
      )}
    </div>
  );
}

// ── SAP Table (checkbox selection) ───────────────────────────────────────────

function SapTable({ routes, config, classeLabel }: {
  routes: KmRouteData[];
  config: KmConfigData;
  classeLabel: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const allSelected = routes.length > 0 && selected.size === routes.length;

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(routes.map(r => r.id)));
  }

  function toggle(id: string) {
    setSelected(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  function buildTSV(ids: Set<string>): string {
    return routes
      .filter(r => ids.has(r.id))
      .map(r => [
        fmtDateSAP(r.date),
        r.km.toLocaleString("pt-BR", { maximumFractionDigits: 1 }),
        config.vehiclePlate,
        config.vehicleType,
        classeLabel,
        config.vehicleBrand,
        r.origin,
        r.destination,
      ].join("\t"))
      .join("\n");
  }

  function handleCopy() {
    const ids = selected.size > 0 ? selected : new Set(routes.map(r => r.id));
    navigator.clipboard.writeText(buildTSV(ids)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (routes.length === 0) {
    return (
      <div className="flex items-center justify-center py-6 border border-dashed border-[var(--color-border2)] rounded-[10px]">
        <span className="text-[12px] text-[var(--color-f4)]">Nenhum trajeto para exibir</span>
      </div>
    );
  }

  const colLabels = ["Data", "KM", "Placa", "Tipo", "Classe", "Marca", "Local Partida", "Destino Final"];

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">Tabela SAP</span>
          {selected.size > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[rgba(34,211,238,0.1)] text-[var(--color-cyan)] border border-[rgba(34,211,238,0.2)]">
              {selected.size} selecionado{selected.size !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[11px] font-medium cursor-pointer border transition-all"
          style={copied
            ? { color: "#22c55e", background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)" }
            : { color: "var(--color-f3)", background: "var(--color-bg3)", borderColor: "var(--color-border2)" }}
        >
          {copied ? <IconCheck size={11} /> : <IconCopy size={11} />}
          {copied ? "Copiado!" : selected.size > 0 ? `Copiar ${selected.size}` : "Copiar tudo"}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[12px] border border-[var(--color-border)]">
        <table className="w-full border-collapse" style={{ minWidth: 760 }}>
          <thead>
            <tr style={{ background: "var(--color-bg3)" }}>
              <th className="px-3 py-2 border-b border-[var(--color-border)] w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-3.5 h-3.5 accent-[var(--color-cyan)] cursor-pointer"
                />
              </th>
              {colLabels.map(col => (
                <th key={col} className="text-left px-3 py-2 text-[9px] font-bold tracking-[1.4px] uppercase text-[var(--color-f4)] border-b border-[var(--color-border)] whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {routes.map(r => {
              const isSelected = selected.has(r.id);
              return (
                <tr
                  key={r.id}
                  onClick={() => toggle(r.id)}
                  className={cn(
                    "border-b border-[var(--color-border)] last:border-0 cursor-pointer transition-colors",
                    isSelected ? "bg-[rgba(34,211,238,0.06)]" : "hover:bg-white/[0.02]"
                  )}
                >
                  <td className="px-3 py-2 w-8" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(r.id)}
                      className="w-3.5 h-3.5 accent-[var(--color-cyan)] cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2 text-[11px] text-[var(--color-f2)] whitespace-nowrap font-mono">{fmtDateSAP(r.date)}</td>
                  <td className="px-3 py-2 text-[11px] text-[var(--color-cyan)] font-medium whitespace-nowrap">
                    {r.km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-[var(--color-f3)] whitespace-nowrap">{config.vehiclePlate || "—"}</td>
                  <td className="px-3 py-2 text-[11px] text-[var(--color-f3)] whitespace-nowrap">{config.vehicleType || "—"}</td>
                  <td className="px-3 py-2 text-[11px] text-[var(--color-f3)] whitespace-nowrap">{classeLabel}</td>
                  <td className="px-3 py-2 text-[11px] text-[var(--color-f3)] whitespace-nowrap">{config.vehicleBrand || "—"}</td>
                  <td className="px-3 py-2 text-[11px] text-[var(--color-f2)] max-w-[140px] truncate">{r.origin}</td>
                  <td className="px-3 py-2 text-[11px] text-[var(--color-f2)] max-w-[140px] truncate">{r.destination}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!config.vehiclePlate && (
        <div className="text-[10px] text-[var(--color-f4)] flex items-center gap-1.5">
          <span className="text-[var(--color-amber)]">!</span>
          Placa e marca do veículo não configurados.{" "}
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
  const [pdfLoading, setPdfLoading] = useState(false);
  const [view, setView] = useState<"text" | "table">("text");

  async function handleExportPdf() {
    setPdfLoading(true);
    try {
      // PDF gerado server-side em /api/km-pdf/[id] — evita bundlar
      // @react-pdf/renderer no cliente (incompatível com Turbopack)
      const res = await fetch(`/api/km-pdf/${period.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = `reembolso-km-${period.name.toLowerCase().replace(/\s+/g, "-")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setPdfLoading(false);
    }
  }

  const isOpen = period.status === "open";
  const totalFuelAmount = period.receipts.reduce((s, r) => s + r.totalAmount, 0);
  const minRequired = period.kmAmount * config.minFuelPct;
  const fuelOk = totalFuelAmount >= minRequired;
  const canSubmit = isOpen && period.totalKm > 0 && fuelOk;

  const byType = period.expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + e.amount; return acc;
  }, {});

  // Derive dominant fuel from receipts
  const gasolineL = period.receipts.filter(r => r.fuelType === "gasoline").reduce((s, r) => s + r.liters, 0);
  const ethanolL  = period.receipts.filter(r => r.fuelType === "ethanol").reduce((s, r) => s + r.liters, 0);
  const dominantFuel = ethanolL > gasolineL ? "ethanol" : "gasoline";
  const fuelLabel = dominantFuel === "ethanol" ? "Etanol" : "Gasolina";
  const taxaPct = dominantFuel === "ethanol"
    ? (config.ethanolRate * 100).toFixed(0)
    : (config.gasolineRate * 100).toFixed(0);
  // Classe for SAP table: "Etanol 36%" or "Gasolina 25%"
  const classeLabel = `${fuelLabel} ${taxaPct}%`;

  // SAP text: routes first, calculations at end
  const routeLines: string[] = [];
  for (const r of period.routes) {
    const dayMonth = fmtDayMonth(r.date);
    const empresa = r.notes ? ` — ${r.notes}` : "";
    routeLines.push(`${dayMonth}${empresa}`);
    routeLines.push(`${r.origin} → ${r.destination} (${r.km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km)`);
    routeLines.push("");
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

  const notesLines = period.notes
    ? [period.notes, "─────────────────────────────", ""]
    : [];

  const summaryText = [...notesLines, ...routeLines, ...calcLines].join("\n");

  function handleCopy() {
    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[10px] p-0.5">
          {(["text", "table"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-medium cursor-pointer border-0 transition-colors",
                view === v ? "bg-[var(--color-bg4)] text-[var(--color-f1)]" : "bg-transparent text-[var(--color-f4)] hover:text-[var(--color-f2)]")}>
              {v === "text" ? <><IconFileText size={11} />Texto SAP</> : <><IconTable size={11} />Tabela SAP</>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {view === "text" && (
            <button onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[11px] font-medium cursor-pointer border transition-all"
              style={copied
                ? { color: "#22c55e", background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)" }
                : { color: "var(--color-f3)", background: "var(--color-bg3)", borderColor: "var(--color-border2)" }}>
              {copied ? <IconCheck size={11} /> : <IconCopy size={11} />}
              {copied ? "Copiado!" : "Copiar texto"}
            </button>
          )}
          {/* PDF export */}
          <button
            onClick={handleExportPdf}
            disabled={pdfLoading || period.routes.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[11px] font-medium cursor-pointer border transition-all disabled:opacity-40"
            style={{ color: "var(--color-f3)", background: "var(--color-bg3)", borderColor: "var(--color-border2)" }}
            title="Exportar PDF com mapa dos trajetos"
          >
            <IconDownload size={11} />
            {pdfLoading ? "Gerando..." : "Exportar PDF"}
          </button>
        </div>
      </div>

      {view === "text" && (
        <div className="bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] p-4 mb-4 font-mono text-[12px] leading-relaxed text-[var(--color-f2)] whitespace-pre-wrap select-all">
          {summaryText}
        </div>
      )}

      {view === "table" && (
        <div className="mb-4">
          <SapTable routes={period.routes} config={config} classeLabel={classeLabel} />
        </div>
      )}

      {/* Total card */}
      <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-[var(--color-f4)] mb-1">Total geral</div>
            <div className="text-[28px] font-bold font-[family-name:var(--font-display)] italic text-[var(--color-f1)]">{fmt(period.grandTotal)}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-[var(--color-f3)]">{period.totalKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km</div>
            <div className="text-[11px] text-[var(--color-f4)]">R$ {period.ratePerKm.toFixed(4)}/km</div>
          </div>
        </div>
        {period.kmAmount > 0 && (
          <div className={cn("flex items-center gap-2 mt-3 pt-3 border-t border-[var(--color-border2)] text-[11px]", fuelOk ? "text-[var(--color-green)]" : "text-[var(--color-amber)]")}>
            {fuelOk ? <IconCheck size={13} /> : <span className="font-bold">!</span>}
            {fuelOk ? `Notas OK: ${fmt(totalFuelAmount)} ≥ mínimo ${fmt(minRequired)}` : `Notas insuficientes: ${fmt(totalFuelAmount)} < mínimo ${fmt(minRequired)}`}
          </div>
        )}
      </div>

      {/* Actions */}
      {isOpen ? (
        <div className="flex flex-col gap-2">
          {!canSubmit && (
            <div className="text-[11px] text-[var(--color-f4)] text-center">
              {period.totalKm === 0 ? "Adicione ao menos um trajeto para enviar." : "Notas de combustível insuficientes para o mínimo exigido."}
            </div>
          )}
          <button onClick={() => { if (!confirm("Marcar como enviado? Isso criará uma transação de crédito no prazo previsto.")) return; start(() => submitPeriod(period.id)); }}
            disabled={!canSubmit || isPending}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] font-semibold text-white cursor-pointer border-0 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            style={{ background: "var(--color-cyan)" }}>
            <IconSend size={14} />{isPending ? "Enviando..." : "Marcar como Enviado"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 p-3 bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.2)] rounded-[10px]">
            <IconClock size={16} className="text-[var(--color-amber)] flex-shrink-0" />
            <div className="flex-1">
              <div className="text-[11px] font-semibold text-[var(--color-amber)]">Solicitação enviada</div>
              {period.expectedPayAt && <div className="text-[10px] text-[var(--color-f4)] mt-0.5">Pagamento previsto: {fmtDate(period.expectedPayAt)}</div>}
            </div>
            <Link href="/transactions" className="text-[10px] text-[var(--color-cyan)] hover:underline no-underline whitespace-nowrap">Ver transação →</Link>
          </div>
          <button onClick={() => { if (!confirm("Reabrir solicitação? A transação associada será excluída.")) return; start(() => reopenPeriod(period.id)); }}
            disabled={isPending}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-medium text-[var(--color-f3)] bg-[var(--color-bg3)] border border-[var(--color-border2)] cursor-pointer hover:text-[var(--color-f1)] hover:border-[var(--color-border)] transition-all disabled:opacity-50">
            <IconRefresh size={13} />{isPending ? "Reabrindo..." : "Reabrir Solicitação"}
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
  period, config, places, userName = "",
}: {
  period: KmPeriodDetail;
  config: KmConfigData;
  places: KmPlaceData[];
  userName?: string;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("routes");
  const [placesOpen, setPlacesOpen] = useState(false);
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerPending, startHeader] = useTransition();
  const [headerForm, setHeaderForm] = useState({
    name: period.name,
    startDate: fmtDateInput(period.startDate),
    endDate: fmtDateInput(period.endDate),
    notes: period.notes ?? "",
  });
  const isOpen = period.status === "open";

  function saveHeader(e: React.FormEvent) {
    e.preventDefault();
    if (!headerForm.name.trim()) return;
    startHeader(async () => {
      await updateKmPeriod(period.id, {
        name: headerForm.name.trim(),
        startDate: headerForm.startDate,
        endDate: headerForm.endDate,
        notes: headerForm.notes.trim() || undefined,
      });
      setEditingHeader(false);
    });
  }

  return (
    <>
      <div className="p-8 max-w-[900px]">
        {/* Header */}
        <div className="mb-6">
          <Link href="/km-reimbursement" className="flex items-center gap-1.5 text-[11px] text-[var(--color-f4)] hover:text-[var(--color-f2)] mb-4 no-underline transition-colors w-fit">
            <IconArrowLeft size={12} />Voltar para histórico
          </Link>

          {editingHeader ? (
            /* ── Inline edit form ── */
            <form onSubmit={saveHeader} className="bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[14px] p-4 flex flex-col gap-3 mb-2">
              <div className="text-[9px] font-bold tracking-[1.5px] uppercase text-[var(--color-cyan)]">Editar solicitação</div>
              <div className="flex flex-col gap-1">
                <Label>Nome</Label>
                <input
                  className={inputCls()}
                  value={headerForm.name}
                  onChange={e => setHeaderForm(f => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label>Data início</Label>
                  <DatePicker value={headerForm.startDate} onChange={v => setHeaderForm(f => ({ ...f, startDate: v }))} height={34} fontSize={12} />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Data fim</Label>
                  <DatePicker value={headerForm.endDate} onChange={v => setHeaderForm(f => ({ ...f, endDate: v }))} height={34} fontSize={12} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label>Observações <span className="text-[var(--color-f4)] font-normal">(opcional)</span></Label>
                <input
                  className={inputCls()}
                  placeholder="Notas gerais sobre esta solicitação..."
                  value={headerForm.notes}
                  onChange={e => setHeaderForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button type="submit" disabled={headerPending || !headerForm.name.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold text-white cursor-pointer border-0 disabled:opacity-50"
                  style={{ background: "var(--color-cyan)" }}>
                  <IconCheck size={12} />{headerPending ? "Salvando..." : "Salvar"}
                </button>
                <button type="button" onClick={() => { setEditingHeader(false); setHeaderForm({ name: period.name, startDate: fmtDateInput(period.startDate), endDate: fmtDateInput(period.endDate), notes: period.notes ?? "" }); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[11px] text-[var(--color-f3)] bg-[var(--color-bg4)] border border-[var(--color-border2)] cursor-pointer hover:text-[var(--color-f1)] transition-colors">
                  <IconX size={11} />Cancelar
                </button>
              </div>
            </form>
          ) : (
            /* ── Normal header display ── */
            <div className="flex items-start justify-between gap-4">
              <div className="group/header flex items-start gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="font-[family-name:var(--font-display)] italic text-[28px] font-bold tracking-tight text-[var(--color-f1)] leading-tight">{period.name}</h1>
                    {!isOpen && (
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", color: "#FBBF24", fontWeight: 700, letterSpacing: 0.3 }}>
                        Enviado
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[var(--color-f4)]">
                    {new Date(period.startDate).toLocaleDateString("pt-BR")} → {new Date(period.endDate).toLocaleDateString("pt-BR")}
                  </div>
                  {period.notes && (
                    <div className="text-[11px] text-[var(--color-f4)] mt-1 italic">{period.notes}</div>
                  )}
                </div>
                {isOpen && (
                  <button
                    onClick={() => setEditingHeader(true)}
                    className="mt-1.5 w-6 h-6 rounded-[6px] flex items-center justify-center text-[var(--color-f4)] hover:text-[var(--color-f2)] hover:bg-[var(--color-bg3)] cursor-pointer border-0 bg-transparent transition-colors opacity-0 group-hover/header:opacity-100"
                    title="Editar solicitação"
                  >
                    <IconPencil size={12} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 mt-1">
                <div className="text-right">
                  <div className="text-[10px] text-[var(--color-f4)] mb-0.5">Total</div>
                  <div className="text-[22px] font-bold font-[family-name:var(--font-display)] italic text-[var(--color-f1)]">
                    {period.grandTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </div>
                </div>
                {/* Lugares button */}
                <button
                  onClick={() => setPlacesOpen(true)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-[10px] text-[11px] font-medium text-[var(--color-f3)] bg-[var(--color-bg3)] border border-[var(--color-border2)] hover:text-[var(--color-f1)] hover:border-[var(--color-border)] transition-all cursor-pointer"
                  title="Lugares cadastrados"
                >
                  <IconMapPin size={13} />
                  Lugares
                  {places.length > 0 && (
                    <span className="text-[9px] px-1 py-0.5 rounded-[4px] bg-[rgba(34,211,238,0.12)] text-[var(--color-cyan)] border border-[rgba(34,211,238,0.2)]">
                      {places.length}
                    </span>
                  )}
                </button>
                <Link href="/km-reimbursement/settings"
                  className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[var(--color-f4)] bg-[var(--color-bg3)] border border-[var(--color-border2)] hover:text-[var(--color-f2)] hover:border-[var(--color-border)] transition-all no-underline"
                  title="Parâmetros">
                  <IconSettings size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-5 border-b border-[var(--color-border)]">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={cn("flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 -mb-px transition-colors cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0",
                activeTab === id ? "text-[var(--color-cyan)] border-b-[var(--color-cyan)]" : "text-[var(--color-f4)] border-b-transparent hover:text-[var(--color-f2)]")}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {activeTab === "routes"   && <RoutesTab period={period} places={places} />}
        {activeTab === "receipts" && <ReceiptsTab period={period} config={config} />}
        {activeTab === "expenses" && <ExpensesTab period={period} />}
        {activeTab === "summary"  && <SummaryTab period={period} config={config} />}
      </div>

      {/* Places Modal */}
      {placesOpen && <PlacesModal places={places} onClose={() => setPlacesOpen(false)} />}
    </>
  );
}

"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { createKmPlace, updateKmPlace, deleteKmPlace } from "@/app/actions/km-reimbursement";
import type { KmPlaceData } from "@/app/actions/km-reimbursement";
import { RouteMap } from "./RouteMap";
import {
  IconArrowLeft, IconMapPin, IconPlus, IconTrash, IconCheck,
  IconMap, IconPencil, IconX,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { AddressAutocomplete } from "./AddressAutocomplete";

function inputCls(extra = "") {
  return `w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[10px] px-3 py-[7px] text-[12px] text-[var(--color-f1)] outline-none h-[34px] focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)] ${extra}`;
}

type PlaceForm = {
  name: string;
  originAddress: string;
  destinationAddress: string;
  kmGoing: string;
  kmReturn: string;
  routeGoing: google.maps.DirectionsResult | null;
  routeReturn: google.maps.DirectionsResult | null;
};

const emptyForm: PlaceForm = {
  name: "", originAddress: "", destinationAddress: "", kmGoing: "", kmReturn: "",
  routeGoing: null, routeReturn: null,
};

function placeToForm(p: KmPlaceData): PlaceForm {
  return {
    name: p.name,
    originAddress: p.originAddress,
    destinationAddress: p.destinationAddress,
    kmGoing: p.kmGoing > 0 ? String(p.kmGoing) : "",
    kmReturn: p.kmReturn > 0 ? String(p.kmReturn) : "",
    routeGoing: (p.routeGoing as google.maps.DirectionsResult | null) ?? null,
    routeReturn: (p.routeReturn as google.maps.DirectionsResult | null) ?? null,
  };
}

/** Strips Google Maps class instances (LatLng, LatLngBounds…) → plain JSON object */
function serializeRoute(d: google.maps.DirectionsResult | null): unknown {
  if (!d) return undefined;
  return JSON.parse(JSON.stringify(d));
}

// ── Shared form fields ────────────────────────────────────────────────────────

function PlaceFormFields({
  form,
  setForm,
  mapDir,
  setMapDir,
}: {
  form: PlaceForm;
  setForm: React.Dispatch<React.SetStateAction<PlaceForm>>;
  mapDir: "going" | "return" | null;
  setMapDir: React.Dispatch<React.SetStateAction<"going" | "return" | null>>;
}) {
  const set = (k: keyof PlaceForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  // Clear saved route geometry whenever addresses change
  const prevAddr = useRef({ o: form.originAddress, d: form.destinationAddress });
  useEffect(() => {
    const p = prevAddr.current;
    if (p.o !== form.originAddress || p.d !== form.destinationAddress) {
      setForm(f => ({ ...f, routeGoing: null, routeReturn: null }));
      prevAddr.current = { o: form.originAddress, d: form.destinationAddress };
    }
  }, [form.originAddress, form.destinationAddress, setForm]);

  const canShowMap =
    form.originAddress.trim().length > 0 && form.destinationAddress.trim().length > 0;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-medium text-[var(--color-f3)]">Nome / Empresa</label>
        <input
          className={inputCls()}
          placeholder="Ex: Empresa XYZ, SENAI Ipiranga..."
          value={form.name}
          onChange={set("name")}
          required
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-[var(--color-f3)]">Endereço de Partida</label>
          <AddressAutocomplete
            className={inputCls()}
            placeholder="Sua casa / escritório..."
            value={form.originAddress}
            onChange={val => setForm(f => ({ ...f, originAddress: val }))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-[var(--color-f3)]">Endereço de Destino</label>
          <AddressAutocomplete
            className={inputCls()}
            placeholder="Av. Paulista, 1000, SP..."
            value={form.destinationAddress}
            onChange={val => setForm(f => ({ ...f, destinationAddress: val }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* KM Ida */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-medium text-[var(--color-f3)]">KM ida</label>
            {canShowMap && (
              <button
                type="button"
                onClick={() => setMapDir(d => d === "going" ? null : "going")}
                className={cn(
                  "flex items-center gap-1 text-[9px] font-medium cursor-pointer bg-transparent border-0 p-0 transition-colors",
                  mapDir === "going"
                    ? "text-[var(--color-cyan)]"
                    : "text-[var(--color-f4)] hover:text-[var(--color-f2)]"
                )}
              >
                <IconMap size={10} />
                {mapDir === "going" ? "fechar" : "ver mapa"}
              </button>
            )}
          </div>
          <input
            type="number" step="0.1" min="0"
            className={inputCls()}
            placeholder="0.0"
            value={form.kmGoing}
            onChange={set("kmGoing")}
          />
        </div>
        {/* KM Volta */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-medium text-[var(--color-f3)]">KM volta</label>
            {canShowMap && (
              <button
                type="button"
                onClick={() => setMapDir(d => d === "return" ? null : "return")}
                className={cn(
                  "flex items-center gap-1 text-[9px] font-medium cursor-pointer bg-transparent border-0 p-0 transition-colors",
                  mapDir === "return"
                    ? "text-[var(--color-cyan)]"
                    : "text-[var(--color-f4)] hover:text-[var(--color-f2)]"
                )}
              >
                <IconMap size={10} />
                {mapDir === "return" ? "fechar" : "ver mapa"}
              </button>
            )}
          </div>
          <input
            type="number" step="0.1" min="0"
            className={inputCls()}
            placeholder="0.0"
            value={form.kmReturn}
            onChange={set("kmReturn")}
          />
        </div>
      </div>

      {/* Map — going */}
      {mapDir === "going" && canShowMap && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[9px] font-medium text-[var(--color-cyan)]">
            Ida: {form.originAddress} → {form.destinationAddress}
          </div>
          <div className="h-[340px] rounded-[10px] overflow-hidden">
            <RouteMap
              origin={form.originAddress}
              destination={form.destinationAddress}
              onKmChange={km => setForm(f => ({ ...f, kmGoing: String(km) }))}
              initialDirections={form.routeGoing}
              onDirectionsChange={d => setForm(f => ({ ...f, routeGoing: d }))}
            />
          </div>
        </div>
      )}
      {/* Map — return */}
      {mapDir === "return" && canShowMap && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[9px] font-medium text-[var(--color-cyan)]">
            Volta: {form.destinationAddress} → {form.originAddress}
          </div>
          <div className="h-[340px] rounded-[10px] overflow-hidden">
            <RouteMap
              origin={form.destinationAddress}
              destination={form.originAddress}
              onKmChange={km => setForm(f => ({ ...f, kmReturn: String(km) }))}
              initialDirections={form.routeReturn}
              onDirectionsChange={d => setForm(f => ({ ...f, routeReturn: d }))}
            />
          </div>
        </div>
      )}
    </>
  );
}

// ── Edit card (inline) ────────────────────────────────────────────────────────

function EditCard({
  place,
  onCancel,
}: {
  place: KmPlaceData;
  onCancel: () => void;
}) {
  const [isPending, start] = useTransition();
  const [form, setForm] = useState<PlaceForm>(() => placeToForm(place));
  const [mapDir, setMapDir] = useState<"going" | "return" | null>(null);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.destinationAddress.trim()) return;
    start(async () => {
      await updateKmPlace(place.id, {
        name: form.name.trim(),
        originAddress: form.originAddress.trim(),
        destinationAddress: form.destinationAddress.trim(),
        kmGoing: parseFloat(form.kmGoing) || 0,
        kmReturn: parseFloat(form.kmReturn) || 0,
        routeGoing: serializeRoute(form.routeGoing),
        routeReturn: serializeRoute(form.routeReturn),
      });
      onCancel(); // close edit mode — server revalidation will refresh list
    });
  }

  return (
    <form
      onSubmit={handleSave}
      className="bg-[var(--color-bg2)] border border-[var(--color-cyan-border)] rounded-[14px] px-5 py-4 flex flex-col gap-3"
    >
      <div className="text-[9px] font-bold tracking-[1.5px] uppercase text-[var(--color-cyan)]">
        Editar lugar
      </div>

      <PlaceFormFields
        form={form}
        setForm={setForm}
        mapDir={mapDir}
        setMapDir={setMapDir}
      />

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending || !form.name.trim() || !form.destinationAddress.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold text-white cursor-pointer border-0 disabled:opacity-50"
          style={{ background: "var(--color-cyan)" }}
        >
          <IconCheck size={12} />
          {isPending ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[11px] text-[var(--color-f3)] bg-[var(--color-bg3)] border border-[var(--color-border2)] cursor-pointer hover:text-[var(--color-f1)] transition-colors"
        >
          <IconX size={11} />
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── Place row (read mode) ─────────────────────────────────────────────────────

function PlaceRow({
  place,
  onEdit,
  onDelete,
  disabled,
}: {
  place: KmPlaceData;
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  return (
    <div className="group flex items-start gap-4 bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[14px] px-5 py-4 hover:border-[var(--color-border2)] transition-colors">
      <IconMapPin size={14} className="text-[var(--color-cyan)] flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[var(--color-f1)] mb-1">{place.name}</div>
        <div className="text-[11px] text-[var(--color-f4)] truncate mb-0.5">
          <span className="text-[var(--color-f3)]">Partida:</span>{" "}
          {place.originAddress || <span className="italic opacity-60">não definido</span>}
        </div>
        <div className="text-[11px] text-[var(--color-f4)] truncate mb-1.5">
          <span className="text-[var(--color-f3)]">Destino:</span>{" "}
          {place.destinationAddress || <span className="italic opacity-60">não definido</span>}
        </div>
        <div className="flex items-center gap-4">
          {place.kmGoing > 0 && (
            <span className="text-[10px] font-medium" style={{ color: "var(--color-cyan)" }}>
              Ida {place.kmGoing.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
            </span>
          )}
          {place.kmReturn > 0 && (
            <span className="text-[10px] font-medium" style={{ color: "var(--color-cyan)" }}>
              Volta {place.kmReturn.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
            </span>
          )}
          {place.kmGoing === 0 && place.kmReturn === 0 && (
            <span className="text-[10px] text-[var(--color-f4)] italic">km não definidos</span>
          )}
        </div>
      </div>
      {/* Action buttons — revealed on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          title="Editar"
          className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[var(--color-f4)] hover:text-[var(--color-cyan)] hover:bg-[rgba(34,211,238,0.08)] cursor-pointer border-0 bg-transparent transition-colors"
        >
          <IconPencil size={13} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          title="Excluir"
          className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[var(--color-f4)] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] cursor-pointer border-0 bg-transparent transition-colors"
        >
          <IconTrash size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Main PlacesPage ───────────────────────────────────────────────────────────

export function PlacesPage({ places }: { places: KmPlaceData[] }) {
  const [isPending, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mapDir, setMapDir] = useState<"going" | "return" | null>(null);
  const [form, setForm] = useState<PlaceForm>(emptyForm);

  function resetAddForm() {
    setAdding(false);
    setMapDir(null);
    setForm(emptyForm);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.destinationAddress.trim()) return;
    start(async () => {
      await createKmPlace({
        name: form.name.trim(),
        originAddress: form.originAddress.trim(),
        destinationAddress: form.destinationAddress.trim(),
        kmGoing: parseFloat(form.kmGoing) || 0,
        kmReturn: parseFloat(form.kmReturn) || 0,
        routeGoing: serializeRoute(form.routeGoing),
        routeReturn: serializeRoute(form.routeReturn),
      });
      resetAddForm();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir lugar?")) return;
    start(() => deleteKmPlace(id));
  }

  return (
    <div className="p-8 max-w-[680px]">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/km-reimbursement"
          className="flex items-center gap-1.5 text-[11px] text-[var(--color-f4)] hover:text-[var(--color-f2)] mb-4 no-underline transition-colors w-fit"
        >
          <IconArrowLeft size={12} />
          Voltar para histórico
        </Link>
        <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
          Reembolso KM
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] italic text-[32px] font-bold tracking-tight text-[var(--color-f1)] leading-tight">
              Lugares <span className="text-[var(--color-cyan)]">Cadastrados</span>
            </h1>
            <p className="text-[var(--color-f3)] text-sm mt-1">
              Empresas e locais frequentes com ida e volta pré-calculados.
            </p>
          </div>
          {!adding && (
            <button
              onClick={() => { setEditingId(null); setAdding(true); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-medium text-[var(--color-cyan)] bg-[rgba(34,211,238,0.08)] border border-[rgba(34,211,238,0.2)] hover:bg-[rgba(34,211,238,0.12)] transition-colors cursor-pointer flex-shrink-0"
            >
              <IconPlus size={13} />
              Novo lugar
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <form
          onSubmit={handleAdd}
          className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[14px] p-5 mb-6 flex flex-col gap-4"
        >
          <div className="text-[9px] font-bold tracking-[1.5px] uppercase text-[var(--color-cyan)]">
            Novo Lugar
          </div>

          <PlaceFormFields
            form={form}
            setForm={setForm}
            mapDir={mapDir}
            setMapDir={setMapDir}
          />

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending || !form.name.trim() || !form.destinationAddress.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold text-white cursor-pointer border-0 disabled:opacity-50"
              style={{ background: "var(--color-cyan)" }}
            >
              <IconCheck size={12} />
              {isPending ? "Salvando..." : "Salvar lugar"}
            </button>
            <button
              type="button"
              onClick={resetAddForm}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[11px] text-[var(--color-f3)] bg-[var(--color-bg3)] border border-[var(--color-border2)] cursor-pointer hover:text-[var(--color-f1)] transition-colors"
            >
              <IconX size={11} />
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {places.length === 0 && !adding && (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[var(--color-border2)] rounded-[14px] text-center">
          <IconMapPin size={40} className="text-[var(--color-f4)] mb-4 opacity-40" />
          <div className="text-[14px] font-medium text-[var(--color-f2)] mb-2">Nenhum lugar cadastrado</div>
          <div className="text-[12px] text-[var(--color-f4)] max-w-xs mb-5">
            Cadastre empresas e locais frequentes para preencher trajetos de ida e volta com um clique.
          </div>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-medium text-white cursor-pointer border-0 hover:opacity-90 transition-opacity"
            style={{ background: "var(--color-cyan)" }}
          >
            <IconPlus size={13} />
            Novo lugar
          </button>
        </div>
      )}

      {/* Places list */}
      {places.length > 0 && (
        <div className="flex flex-col gap-3">
          {places.map(place =>
            editingId === place.id ? (
              <EditCard
                key={place.id}
                place={place}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <PlaceRow
                key={place.id}
                place={place}
                disabled={isPending}
                onEdit={() => { resetAddForm(); setEditingId(place.id); }}
                onDelete={() => handleDelete(place.id)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

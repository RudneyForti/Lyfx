"use client";

import { useState, useTransition, useEffect } from "react";
import { createKmPlace, deleteKmPlace } from "@/app/actions/km-reimbursement";
import type { KmPlaceData } from "@/app/actions/km-reimbursement";
import { RouteMap } from "./RouteMap";
import {
  IconX, IconMapPin, IconPlus, IconTrash, IconCheck, IconMap,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

function inputCls(extra = "") {
  return `w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[10px] px-3 py-[7px] text-[12px] text-[var(--color-f1)] outline-none h-[34px] focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)] ${extra}`;
}

interface PlacesModalProps {
  places: KmPlaceData[];
  onClose: () => void;
}

export function PlacesModal({ places, onClose }: PlacesModalProps) {
  const [isPending, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const [mapDir, setMapDir] = useState<"going" | "return" | null>(null);
  const [form, setForm] = useState({
    name: "",
    originAddress: "",
    destinationAddress: "",
    kmGoing: "",
    kmReturn: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const canShowMap = form.originAddress.trim().length > 0 && form.destinationAddress.trim().length > 0;

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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
      });
      setForm({ name: "", originAddress: "", destinationAddress: "", kmGoing: "", kmReturn: "" });
      setMapDir(null);
      setAdding(false);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir lugar?")) return;
    start(() => deleteKmPlace(id));
  }

  function resetForm() {
    setAdding(false);
    setMapDir(null);
    setForm({ name: "", originAddress: "", destinationAddress: "", kmGoing: "", kmReturn: "" });
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div
        className="relative flex flex-col w-full max-w-[560px] max-h-[85vh] rounded-[18px] overflow-hidden"
        style={{
          background: "var(--color-bg2)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <IconMapPin size={14} className="text-[var(--color-cyan)]" />
            <span className="text-[14px] font-semibold text-[var(--color-f1)]">Lugares Cadastrados</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[var(--color-bg3)] text-[var(--color-f4)] border border-[var(--color-border2)]">
              {places.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!adding && (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[11px] font-medium text-[var(--color-cyan)] bg-[rgba(34,211,238,0.08)] border border-[rgba(34,211,238,0.2)] hover:bg-[rgba(34,211,238,0.12)] transition-colors cursor-pointer"
              >
                <IconPlus size={11} />
                Novo lugar
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[var(--color-f4)] hover:text-[var(--color-f1)] hover:bg-[var(--color-bg3)] cursor-pointer border-0 bg-transparent transition-colors"
            >
              <IconX size={14} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* Add form */}
          {adding && (
            <form onSubmit={handleAdd} className="bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] p-4 mb-4 flex flex-col gap-3">
              <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-[var(--color-cyan)] mb-1">Novo Lugar</div>

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
                  <input
                    className={inputCls()}
                    placeholder="Sua casa / escritório..."
                    value={form.originAddress}
                    onChange={set("originAddress")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-medium text-[var(--color-f3)]">Endereço de Destino</label>
                  <input
                    className={inputCls()}
                    placeholder="Av. Paulista, 1000, SP..."
                    value={form.destinationAddress}
                    onChange={set("destinationAddress")}
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
                        className={cn("flex items-center gap-1 text-[9px] font-medium cursor-pointer bg-transparent border-0 p-0 transition-colors", mapDir === "going" ? "text-[var(--color-cyan)]" : "text-[var(--color-f4)] hover:text-[var(--color-f2)]")}
                      >
                        <IconMap size={10} />
                        {mapDir === "going" ? "fechar" : "ver mapa"}
                      </button>
                    )}
                  </div>
                  <input type="number" step="0.1" min="0" className={inputCls()} placeholder="0.0" value={form.kmGoing} onChange={set("kmGoing")} />
                </div>
                {/* KM Volta */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-medium text-[var(--color-f3)]">KM volta</label>
                    {canShowMap && (
                      <button
                        type="button"
                        onClick={() => setMapDir(d => d === "return" ? null : "return")}
                        className={cn("flex items-center gap-1 text-[9px] font-medium cursor-pointer bg-transparent border-0 p-0 transition-colors", mapDir === "return" ? "text-[var(--color-cyan)]" : "text-[var(--color-f4)] hover:text-[var(--color-f2)]")}
                      >
                        <IconMap size={10} />
                        {mapDir === "return" ? "fechar" : "ver mapa"}
                      </button>
                    )}
                  </div>
                  <input type="number" step="0.1" min="0" className={inputCls()} placeholder="0.0" value={form.kmReturn} onChange={set("kmReturn")} />
                </div>
              </div>

              {/* Map panel — going */}
              {mapDir === "going" && canShowMap && (
                <div className="flex flex-col gap-1.5">
                  <div className="text-[9px] font-medium text-[var(--color-cyan)]">
                    Ida: {form.originAddress} → {form.destinationAddress}
                  </div>
                  <div className="h-[180px] rounded-[10px] overflow-hidden">
                    <RouteMap
                      origin={form.originAddress}
                      destination={form.destinationAddress}
                      onKmChange={km => setForm(f => ({ ...f, kmGoing: String(km) }))}
                    />
                  </div>
                </div>
              )}
              {/* Map panel — return */}
              {mapDir === "return" && canShowMap && (
                <div className="flex flex-col gap-1.5">
                  <div className="text-[9px] font-medium text-[var(--color-cyan)]">
                    Volta: {form.destinationAddress} → {form.originAddress}
                  </div>
                  <div className="h-[180px] rounded-[10px] overflow-hidden">
                    <RouteMap
                      origin={form.destinationAddress}
                      destination={form.originAddress}
                      onKmChange={km => setForm(f => ({ ...f, kmReturn: String(km) }))}
                    />
                  </div>
                </div>
              )}

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
                  onClick={resetForm}
                  className="px-3 py-1.5 rounded-[8px] text-[11px] text-[var(--color-f3)] bg-[var(--color-bg4)] border border-[var(--color-border2)] cursor-pointer hover:text-[var(--color-f1)] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Empty state */}
          {places.length === 0 && !adding && (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-[var(--color-border2)] rounded-[12px] text-center">
              <IconMapPin size={28} className="text-[var(--color-f4)] mb-3 opacity-40" />
              <div className="text-[12px] font-medium text-[var(--color-f2)] mb-1">Nenhum lugar cadastrado</div>
              <div className="text-[11px] text-[var(--color-f4)] max-w-xs">
                Cadastre empresas e locais frequentes para preencher trajetos de ida e volta com um clique.
              </div>
            </div>
          )}

          {/* Places list */}
          {places.length > 0 && (
            <div className="flex flex-col gap-2">
              {places.map(place => (
                <div
                  key={place.id}
                  className="group flex items-start gap-3 bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] px-4 py-3 hover:border-[var(--color-border)] transition-colors"
                >
                  <IconMapPin size={13} className="text-[var(--color-cyan)] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-[var(--color-f1)] mb-0.5">{place.name}</div>
                    <div className="text-[10px] text-[var(--color-f4)] truncate">
                      <span className="text-[var(--color-f3)]">Partida:</span>{" "}
                      {place.originAddress || <span className="italic opacity-60">não definido</span>}
                    </div>
                    <div className="text-[10px] text-[var(--color-f4)] truncate">
                      <span className="text-[var(--color-f3)]">Destino:</span>{" "}
                      {place.destinationAddress || <span className="italic opacity-60">não definido</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {place.kmGoing > 0 && (
                        <span className="text-[9px] font-medium" style={{ color: "var(--color-cyan)" }}>
                          Ida {place.kmGoing.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
                        </span>
                      )}
                      {place.kmReturn > 0 && (
                        <span className="text-[9px] font-medium" style={{ color: "var(--color-cyan)" }}>
                          Volta {place.kmReturn.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(place.id)}
                    disabled={isPending}
                    className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[var(--color-f4)] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] cursor-pointer border-0 bg-transparent transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  >
                    <IconTrash size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

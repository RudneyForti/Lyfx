"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveKmConfig, createKmPlace, deleteKmPlace } from "@/app/actions/km-reimbursement";
import type { KmConfigData, KmPlaceData } from "@/app/actions/km-reimbursement";
import { RouteMap } from "./RouteMap";
import { IconArrowLeft, IconCheck, IconSettings, IconMapPin, IconTrash, IconPlus, IconCar, IconMap } from "@tabler/icons-react";

function inputCls(extra = "") {
  return `w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] px-3 py-[9px] text-[13px] text-[var(--color-f1)] outline-none h-[38px] focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)] ${extra}`;
}

function inputSmCls(extra = "") {
  return `w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[10px] px-3 py-[7px] text-[12px] text-[var(--color-f1)] outline-none h-[34px] focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)] ${extra}`;
}

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="text-[11px] font-medium text-[var(--color-f2)]">{children}</label>
      {hint && <div className="text-[10px] text-[var(--color-f4)] mt-0.5">{hint}</div>}
    </div>
  );
}

// ── Places Section ────────────────────────────────────────────────────────────

function PlacesSection({ places }: { places: KmPlaceData[] }) {
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

  const canShowMap = form.originAddress.trim().length > 0 && form.destinationAddress.trim().length > 0;

  function handleDelete(id: string) {
    if (!confirm("Excluir lugar?")) return;
    start(() => deleteKmPlace(id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[11px] font-semibold text-[var(--color-f2)] flex items-center gap-1.5">
            <IconMapPin size={12} className="text-[var(--color-cyan)]" />
            Lugares Cadastrados
          </div>
          <div className="text-[10px] text-[var(--color-f4)] mt-0.5">
            Empresas e locais frequentes para preencher trajetos (ida e volta) rapidamente
          </div>
        </div>
        <button
          onClick={() => setAdding(v => !v)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[11px] font-medium text-[var(--color-cyan)] bg-[rgba(34,211,238,0.08)] border border-[rgba(34,211,238,0.2)] hover:bg-[rgba(34,211,238,0.12)] transition-colors cursor-pointer"
        >
          <IconPlus size={11} />
          Adicionar
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} className="bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] p-4 mb-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-[var(--color-f3)]">Nome / Empresa</label>
            <input
              className={inputSmCls()}
              placeholder="Ex: Empresa XYZ, Cliente ABC..."
              value={form.name}
              onChange={set("name")}
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-[var(--color-f3)]">Endereço de Partida (origem)</label>
              <input
                className={inputSmCls()}
                placeholder="Ex: Rua Principal, 100, Cidade"
                value={form.originAddress}
                onChange={set("originAddress")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-medium text-[var(--color-f3)]">Endereço de Destino</label>
              <input
                className={inputSmCls()}
                placeholder="Ex: Av. Paulista, 1000, São Paulo"
                value={form.destinationAddress}
                onChange={set("destinationAddress")}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium text-[var(--color-f3)]">KM ida</label>
                {canShowMap && (
                  <button
                    type="button"
                    onClick={() => setMapDir(d => d === "going" ? null : "going")}
                    className="flex items-center gap-1 text-[9px] font-medium cursor-pointer bg-transparent border-0 p-0 transition-colors"
                    style={{ color: mapDir === "going" ? "var(--color-cyan)" : "var(--color-f4)" }}
                  >
                    <IconMap size={10} />
                    {mapDir === "going" ? "fechar" : "ver mapa"}
                  </button>
                )}
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                className={inputSmCls()}
                placeholder="0.0"
                value={form.kmGoing}
                onChange={set("kmGoing")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium text-[var(--color-f3)]">KM volta</label>
                {canShowMap && (
                  <button
                    type="button"
                    onClick={() => setMapDir(d => d === "return" ? null : "return")}
                    className="flex items-center gap-1 text-[9px] font-medium cursor-pointer bg-transparent border-0 p-0 transition-colors"
                    style={{ color: mapDir === "return" ? "var(--color-cyan)" : "var(--color-f4)" }}
                  >
                    <IconMap size={10} />
                    {mapDir === "return" ? "fechar" : "ver mapa"}
                  </button>
                )}
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                className={inputSmCls()}
                placeholder="0.0"
                value={form.kmReturn}
                onChange={set("kmReturn")}
              />
            </div>
          </div>

          {/* Map panel */}
          {mapDir === "going" && canShowMap && (
            <div className="flex flex-col gap-1.5">
              <div className="text-[9px] font-medium text-[var(--color-cyan)]">
                Ida: {form.originAddress} → {form.destinationAddress}
              </div>
              <div className="h-[200px] rounded-[10px] overflow-hidden">
                <RouteMap
                  origin={form.originAddress}
                  destination={form.destinationAddress}
                  onKmChange={km => setForm(f => ({ ...f, kmGoing: String(km) }))}
                />
              </div>
            </div>
          )}
          {mapDir === "return" && canShowMap && (
            <div className="flex flex-col gap-1.5">
              <div className="text-[9px] font-medium text-[var(--color-cyan)]">
                Volta: {form.destinationAddress} → {form.originAddress}
              </div>
              <div className="h-[200px] rounded-[10px] overflow-hidden">
                <RouteMap
                  origin={form.destinationAddress}
                  destination={form.originAddress}
                  onKmChange={km => setForm(f => ({ ...f, kmReturn: String(km) }))}
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
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
              onClick={() => { setAdding(false); setMapDir(null); setForm({ name: "", originAddress: "", destinationAddress: "", kmGoing: "", kmReturn: "" }); }}
              className="px-3 py-1.5 rounded-[8px] text-[11px] text-[var(--color-f3)] bg-[var(--color-bg4)] border border-[var(--color-border2)] cursor-pointer hover:text-[var(--color-f1)] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Places list */}
      {places.length === 0 && !adding && (
        <div className="flex items-center justify-center py-6 border border-dashed border-[var(--color-border2)] rounded-[12px]">
          <span className="text-[12px] text-[var(--color-f4)]">Nenhum lugar cadastrado</span>
        </div>
      )}

      {places.length > 0 && (
        <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] overflow-hidden">
          {places.map(place => (
            <div key={place.id} className="flex items-start gap-3 px-4 py-3 border-b border-[var(--color-border)] last:border-0 group">
              <IconMapPin size={13} className="text-[var(--color-cyan)] flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-[var(--color-f1)] truncate">{place.name}</div>
                <div className="text-[10px] text-[var(--color-f4)] mt-0.5 truncate">
                  {place.originAddress
                    ? <><span className="text-[var(--color-f3)]">Partida:</span> {place.originAddress}</>
                    : <span className="italic">sem endereço de partida</span>}
                </div>
                <div className="text-[10px] text-[var(--color-f4)] mt-0.5 truncate">
                  <span className="text-[var(--color-f3)]">Destino:</span> {place.destinationAddress || <span className="italic">—</span>}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {place.kmGoing > 0 && (
                    <span className="text-[9px] text-[var(--color-cyan)]">
                      Ida: {place.kmGoing.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
                    </span>
                  )}
                  {place.kmReturn > 0 && (
                    <span className="text-[9px] text-[var(--color-cyan)]">
                      Volta: {place.kmReturn.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
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
  );
}

// ── Main KmSettings ───────────────────────────────────────────────────────────

export function KmSettings({ config, places }: { config: KmConfigData; places: KmPlaceData[] }) {
  const [isPending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    gasolineRate: String(config.gasolineRate),
    ethanolRate:  String(config.ethanolRate),
    minFuelPct:   String(config.minFuelPct),
    paymentDays:  String(config.paymentDays),
    vehiclePlate: config.vehiclePlate,
    vehicleType:  config.vehicleType,
    vehicleClass: config.vehicleClass,
    vehicleBrand: config.vehicleBrand,
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      await saveKmConfig({
        gasolineRate: parseFloat(form.gasolineRate) || 0.25,
        ethanolRate:  parseFloat(form.ethanolRate) || 0.36,
        minFuelPct:   parseFloat(form.minFuelPct) || 0.15,
        paymentDays:  parseInt(form.paymentDays) || 5,
        vehiclePlate: form.vehiclePlate,
        vehicleType:  form.vehicleType,
        vehicleClass: form.vehicleClass,
        vehicleBrand: form.vehicleBrand,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  const rateFields = [
    {
      key: "gasolineRate",
      label: "Taxa Gasolina",
      hint: "Fator multiplicado pelo preço/litro para obter o valor por km (ex: 0.25 = 25%)",
      step: "0.01", min: "0", max: "1", suffix: "× preço/litro",
    },
    {
      key: "ethanolRate",
      label: "Taxa Etanol",
      hint: "Fator multiplicado pelo preço/litro para etanol (ex: 0.36 = 36%)",
      step: "0.01", min: "0", max: "1", suffix: "× preço/litro",
    },
    {
      key: "minFuelPct",
      label: "Mínimo de Notas",
      hint: "Percentual mínimo do valor km que deve estar coberto por notas de combustível",
      step: "0.01", min: "0", max: "1", suffix: "× valor km",
    },
    {
      key: "paymentDays",
      label: "Prazo de Pagamento",
      hint: "Dias úteis após o envio para o pagamento previsto (D+N)",
      step: "1", min: "1", max: "60", suffix: "dias úteis",
    },
  ];

  return (
    <div className="p-8 max-w-[560px]">
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
          Configurações
        </div>
        <h1 className="font-[family-name:var(--font-display)] italic text-[32px] font-bold tracking-tight text-[var(--color-f1)] leading-tight">
          Reem<span className="text-[var(--color-cyan)]">bolso Especial</span>
        </h1>
        <p className="text-[var(--color-f3)] text-sm mt-2">
          Ajuste as taxas, veículo, regras e locais frequentes do módulo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 mb-8">
        {/* Rate params */}
        <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[14px] p-5 flex flex-col gap-5">
          <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-[var(--color-border)]">
            Parâmetros de Cálculo
          </div>
          {rateFields.map(f => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <Label hint={f.hint}>{f.label}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={f.step}
                  min={f.min}
                  max={f.max}
                  className={inputCls("flex-1")}
                  value={form[f.key as keyof typeof form]}
                  onChange={set(f.key)}
                  required
                />
                <span className="text-[11px] text-[var(--color-f4)] whitespace-nowrap">{f.suffix}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Vehicle */}
        <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[14px] p-5 flex flex-col gap-4">
          <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-[var(--color-border)]">
            <IconCar size={11} />
            Veículo
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label hint="Número da placa do veículo">Placa</Label>
              <input
                className={inputCls()}
                placeholder="Ex: ABC-1234"
                value={form.vehiclePlate}
                onChange={set("vehiclePlate")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label hint="Marca do veículo">Marca</Label>
              <input
                className={inputCls()}
                placeholder="Ex: Toyota, Honda..."
                value={form.vehicleBrand}
                onChange={set("vehicleBrand")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label hint="Tipo de posse do veículo">Tipo</Label>
              <input
                className={inputCls()}
                placeholder="Ex: Próprio, Empresa..."
                value={form.vehicleType}
                onChange={set("vehicleType")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label hint="Classe do veículo para o SAP">Classe</Label>
              <input
                className={inputCls()}
                placeholder="Ex: Passeio, Utilitário..."
                value={form.vehicleClass}
                onChange={set("vehicleClass")}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] p-4">
          <div className="text-[9px] font-bold tracking-[1.5px] uppercase text-[var(--color-f4)] mb-3">Exemplo com gasolina a R$ 6,50/litro</div>
          <div className="flex flex-col gap-1.5 text-[12px] text-[var(--color-f3)]">
            <div className="flex justify-between">
              <span>Preço/litro</span>
              <span className="font-medium text-[var(--color-f1)]">R$ 6,50</span>
            </div>
            <div className="flex justify-between">
              <span>Taxa gasolina ({(parseFloat(form.gasolineRate) * 100 || 0).toFixed(0)}%)</span>
              <span className="font-medium text-[var(--color-f1)]">
                R$ {(6.50 * (parseFloat(form.gasolineRate) || 0)).toFixed(3)}/km
              </span>
            </div>
            <div className="border-t border-[var(--color-border2)] pt-1.5 flex justify-between">
              <span>100 km rodados</span>
              <span className="font-medium text-[var(--color-cyan)]">
                R$ {(100 * 6.50 * (parseFloat(form.gasolineRate) || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] font-semibold text-white transition-all cursor-pointer border-0 disabled:opacity-50"
          style={{ background: saved ? "#22c55e" : "var(--color-cyan)" }}
        >
          {saved ? <IconCheck size={15} /> : <IconSettings size={15} />}
          {isPending ? "Salvando..." : saved ? "Salvo!" : "Salvar Parâmetros"}
        </button>
      </form>

      {/* Places section */}
      <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[14px] p-5">
        <PlacesSection places={places} />
      </div>
    </div>
  );
}

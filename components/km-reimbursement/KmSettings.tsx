"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveKmConfig, createKmPlace, deleteKmPlace } from "@/app/actions/km-reimbursement";
import type { KmConfigData, KmPlaceData } from "@/app/actions/km-reimbursement";
import { IconArrowLeft, IconCheck, IconSettings, IconMapPin, IconTrash, IconPlus } from "@tabler/icons-react";

function inputCls(extra = "") {
  return `w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] px-3 py-[9px] text-[13px] text-[var(--color-f1)] outline-none h-[38px] focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)] ${extra}`;
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
  const [form, setForm] = useState({ name: "", address: "" });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim()) return;
    start(async () => {
      await createKmPlace({ name: form.name.trim(), address: form.address.trim() });
      setForm({ name: "", address: "" });
      setAdding(false);
    });
  }

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
            Empresas e locais frequentes para preencher trajetos rapidamente
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
              className={inputCls()}
              placeholder="Ex: Empresa XYZ, Cliente ABC..."
              value={form.name}
              onChange={set("name")}
              required
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium text-[var(--color-f3)]">Endereço</label>
            <input
              className={inputCls()}
              placeholder="Ex: Av. Paulista, 1000, São Paulo"
              value={form.address}
              onChange={set("address")}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending || !form.name.trim() || !form.address.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold text-white cursor-pointer border-0 disabled:opacity-50"
              style={{ background: "var(--color-cyan)" }}
            >
              <IconCheck size={12} />
              {isPending ? "Salvando..." : "Salvar lugar"}
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setForm({ name: "", address: "" }); }}
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
            <div key={place.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] last:border-0 group">
              <IconMapPin size={13} className="text-[var(--color-cyan)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-[var(--color-f1)] truncate">{place.name}</div>
                <div className="text-[10px] text-[var(--color-f4)] truncate">{place.address}</div>
              </div>
              <button
                onClick={() => handleDelete(place.id)}
                disabled={isPending}
                className="w-6 h-6 rounded-[6px] flex items-center justify-center text-[var(--color-f4)] hover:text-red-400 hover:bg-[rgba(239,68,68,0.1)] cursor-pointer border-0 bg-transparent transition-colors opacity-0 group-hover:opacity-100"
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
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  const fields = [
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
          Ajuste as taxas, regras e locais frequentes do módulo.
        </p>
      </div>

      {/* Params form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
        <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[14px] p-5 flex flex-col gap-5">
          {fields.map(f => (
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

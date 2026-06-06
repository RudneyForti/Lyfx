"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveKmConfig } from "@/app/actions/km-reimbursement";
import type { KmConfigData } from "@/app/actions/km-reimbursement";
import { IconArrowLeft, IconCheck, IconSettings, IconMapPin, IconCar, IconChevronRight } from "@tabler/icons-react";

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

// ── Main KmSettings ───────────────────────────────────────────────────────────

export function KmSettings({ config }: { config: KmConfigData }) {
  const [isPending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    gasolineRate: String(config.gasolineRate),
    ethanolRate:  String(config.ethanolRate),
    minFuelPct:   String(config.minFuelPct),
    paymentDays:  String(config.paymentDays),
    vehiclePlate: config.vehiclePlate,
    vehicleType:  config.vehicleType,
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
              <Label hint="Tipo de veículo — o SENAI remunera apenas deslocamentos de Carro">Tipo</Label>
              <input
                className={inputCls()}
                placeholder="Carro"
                value={form.vehicleType}
                onChange={set("vehicleType")}
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

      {/* Places link */}
      <Link
        href="/km-reimbursement/places"
        className="flex items-center justify-between bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[14px] p-5 no-underline hover:border-[var(--color-cyan-border)] transition-colors group"
      >
        <div className="flex items-start gap-3">
          <IconMapPin size={15} className="text-[var(--color-cyan)] flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[13px] font-semibold text-[var(--color-f1)] mb-0.5">Lugares Cadastrados</div>
            <div className="text-[11px] text-[var(--color-f4)]">
              Empresas e locais frequentes com ida e volta pré-calculados
            </div>
          </div>
        </div>
        <IconChevronRight size={14} className="text-[var(--color-f4)] group-hover:text-[var(--color-cyan)] transition-colors flex-shrink-0" />
      </Link>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createKmPeriod } from "@/app/actions/km-reimbursement";
import { IconCar, IconArrowLeft } from "@tabler/icons-react";

function inputCls(extra = "") {
  return `w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] px-3 py-[9px] text-[13px] text-[var(--color-f1)] outline-none h-[38px] focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)] ${extra}`;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-medium text-[var(--color-f2)]">{children}</label>;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

export function NewPeriodForm() {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [form, setForm] = useState({
    name: "",
    startDate: today(),
    endDate: today(),
    fuelType: "gasoline",
    notes: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    start(async () => {
      const result = await createKmPeriod({
        name: form.name.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        fuelType: form.fuelType,
        notes: form.notes.trim() || undefined,
      });
      router.push(`/km-reimbursement/${result.id}`);
    });
  }

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
          Nova Solicitação
        </div>
        <h1 className="font-[family-name:var(--font-display)] italic text-[32px] font-bold tracking-tight text-[var(--color-f1)] leading-tight">
          Reem<span className="text-[var(--color-cyan)]">bolso KM</span>
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[14px] p-5 flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label>Nome da solicitação</Label>
            <input
              className={inputCls()}
              placeholder="Ex: Junho 2026, Viagem SP-RJ..."
              value={form.name}
              onChange={set("name")}
              required
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Data de início</Label>
              <input type="date" className={inputCls()} value={form.startDate} onChange={set("startDate")} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Data de fim</Label>
              <input type="date" className={inputCls()} value={form.endDate} onChange={set("endDate")} required />
            </div>
          </div>

          {/* Fuel type */}
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de combustível</Label>
            <select className={inputCls("cursor-pointer")} value={form.fuelType} onChange={set("fuelType")}>
              <option value="gasoline">Gasolina</option>
              <option value="ethanol">Etanol</option>
            </select>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label>Observações <span className="text-[var(--color-f4)] font-normal">(opcional)</span></Label>
            <textarea
              className="w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] px-3 py-2.5 text-[13px] text-[var(--color-f1)] outline-none focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)] resize-none"
              rows={2}
              placeholder="Contexto da solicitação..."
              value={form.notes}
              onChange={set("notes")}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || !form.name.trim()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] font-semibold text-white transition-opacity cursor-pointer border-0 disabled:opacity-50"
          style={{ background: "var(--color-cyan)" }}
        >
          <IconCar size={15} />
          {isPending ? "Criando..." : "Criar Solicitação"}
        </button>
      </form>
    </div>
  );
}

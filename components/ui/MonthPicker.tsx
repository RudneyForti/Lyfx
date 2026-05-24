"use client";

import { useState, useRef, useEffect } from "react";
import { IconChevronLeft, IconChevronRight, IconCalendar, IconX } from "@tabler/icons-react";

const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTHS_FULL  = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

interface Props {
  value: string;           // "YYYY-MM" or ""
  onChange: (v: string) => void;
  placeholder?: string;
  height?: number;
  fontSize?: number;
}

export function MonthPicker({ value, onChange, placeholder = "Selecione o mês", height = 40, fontSize = 13 }: Props) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => {
    if (value) return parseInt(value.split("-")[0]);
    return new Date().getFullYear();
  });
  const ref = useRef<HTMLDivElement>(null);

  const selYear  = value ? parseInt(value.split("-")[0]) : null;
  const selMonth = value ? parseInt(value.split("-")[1]) - 1 : null; // 0-indexed

  const display = selYear !== null && selMonth !== null
    ? `${MONTHS_FULL[selMonth]} de ${selYear}`
    : "";

  // Sync year display when value changes from outside
  useEffect(() => {
    if (value) setYear(parseInt(value.split("-")[0]));
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function pick(monthIdx: number) {
    const mm = String(monthIdx + 1).padStart(2, "0");
    onChange(`${year}-${mm}`);
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[8px] px-3 outline-none transition-all cursor-pointer"
        style={{
          height,
          fontSize,
          borderColor: open ? "var(--color-cyan-border)" : undefined,
          color: display ? "var(--color-f1)" : "var(--color-f4)",
        }}
      >
        <span className="truncate">{display || placeholder}</span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              onClick={clear}
              className="text-[var(--color-f4)] hover:text-[var(--color-f2)] transition-colors p-0.5"
            >
              <IconX size={11} />
            </span>
          )}
          <IconCalendar size={14} className="text-[var(--color-f4)]" />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-[calc(100%+6px)] left-0 min-w-[220px] bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] shadow-[0_12px_40px_rgba(0,0,0,0.7)] p-3">

          {/* Year row */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              className="p-1 rounded-[6px] text-[var(--color-f3)] hover:text-[var(--color-f1)] hover:bg-white/[0.06] cursor-pointer transition-colors"
            >
              <IconChevronLeft size={13} />
            </button>
            <span className="text-[13px] font-semibold text-[var(--color-f1)]">{year}</span>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              className="p-1 rounded-[6px] text-[var(--color-f3)] hover:text-[var(--color-f1)] hover:bg-white/[0.06] cursor-pointer transition-colors"
            >
              <IconChevronRight size={13} />
            </button>
          </div>

          {/* Month grid — 4 × 3 */}
          <div className="grid grid-cols-4 gap-1">
            {MONTHS_SHORT.map((label, i) => {
              const isSelected = selYear === year && selMonth === i;
              // CS-14: destacar o mês atual com borda cyan quando não está selecionado
              const now = new Date();
              const isCurrentMonth = year === now.getFullYear() && i === now.getMonth();
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(i)}
                  className="py-[7px] rounded-[7px] text-[11px] font-medium transition-all cursor-pointer"
                  style={{
                    background: isSelected ? "var(--color-cyan)" : "transparent",
                    color: isSelected ? "#083344" : isCurrentMonth ? "var(--color-cyan)" : "var(--color-f2)",
                    border: isCurrentMonth && !isSelected ? "1px solid var(--color-cyan-border)" : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { IconChevronLeft, IconChevronRight, IconCalendar, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDate(value: string): Date | null {
  if (!value) return null;
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtBR(value: string): string {
  const d = parseDate(value);
  if (!d) return "";
  return d.toLocaleDateString("pt-BR");
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DatePickerProps {
  value: string;         // YYYY-MM-DD
  onChange: (v: string) => void;
  placeholder?: string;
  height?: number;
  fontSize?: number;
  required?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DatePicker({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  height = 38,
  fontSize = 13,
}: DatePickerProps) {
  const selected = parseDate(value);
  const today = new Date();

  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<{ year: number; month: number }>(() => {
    const d = selected ?? today;
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync viewing month when value changes externally
  useEffect(() => {
    if (selected) {
      setViewing({ year: selected.getFullYear(), month: selected.getMonth() });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  function prevMonth() {
    setViewing(v => v.month === 0
      ? { year: v.year - 1, month: 11 }
      : { ...v, month: v.month - 1 });
  }
  function nextMonth() {
    setViewing(v => v.month === 11
      ? { year: v.year + 1, month: 0 }
      : { ...v, month: v.month + 1 });
  }

  // ── Day selection ───────────────────────────────────────────────────────────

  function selectDay(day: number) {
    onChange(toISO(new Date(viewing.year, viewing.month, day)));
    setOpen(false);
  }
  function clearDate(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }
  function goToday() {
    onChange(toISO(today));
    setViewing({ year: today.getFullYear(), month: today.getMonth() });
    setOpen(false);
  }

  // ── Build calendar grid ─────────────────────────────────────────────────────

  const daysInMonth = new Date(viewing.year, viewing.month + 1, 0).getDate();
  const firstDow    = new Date(viewing.year, viewing.month, 1).getDay(); // 0=Sun

  // Previous month overflow
  const prevDays = new Date(
    viewing.month === 0 ? viewing.year - 1 : viewing.year,
    viewing.month === 0 ? 12 : viewing.month,
    0
  ).getDate();

  type Cell = { day: number; kind: "prev" | "cur" | "next" };
  const cells: Cell[] = [];

  for (let i = firstDow - 1; i >= 0; i--)
    cells.push({ day: prevDays - i, kind: "prev" });

  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, kind: "cur" });

  let nd = 1;
  while (cells.length < 42) cells.push({ day: nd++, kind: "next" });

  // ── Render ──────────────────────────────────────────────────────────────────

  const display = fmtBR(value);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] px-3 outline-none transition-all cursor-pointer"
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
              onClick={clearDate}
              className="text-[var(--color-f4)] hover:text-[var(--color-f2)] transition-colors p-0.5"
            >
              <IconX size={11} />
            </span>
          )}
          <IconCalendar size={14} className="text-[var(--color-f4)]" />
        </div>
      </button>

      {/* ── Popup ── */}
      {open && (
        <div
          className="absolute z-50 top-[calc(100%+6px)] left-0 min-w-[252px]"
          style={{
            background: "var(--color-bg3)",
            border: "1px solid var(--color-border2)",
            borderRadius: 14,
            boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
          }}
        >
          {/* Month header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border2)]">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-[6px] text-[var(--color-f3)] hover:text-[var(--color-f1)] hover:bg-white/[0.06] cursor-pointer transition-colors border-0 bg-transparent"
            >
              <IconChevronLeft size={14} />
            </button>
            <span className="text-[12px] font-semibold text-[var(--color-f1)]">
              {MONTHS_FULL[viewing.month]} de {viewing.year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-[6px] text-[var(--color-f3)] hover:text-[var(--color-f1)] hover:bg-white/[0.06] cursor-pointer transition-colors border-0 bg-transparent"
            >
              <IconChevronRight size={14} />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 px-3 pt-2.5 pb-1">
            {WEEKDAYS.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-center text-[9px] font-bold tracking-wide text-[var(--color-f4)] h-6"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 px-3 pb-2">
            {cells.map((cell, i) => {
              const isCur = cell.kind === "cur";
              const cellDate = new Date(
                cell.kind === "prev"
                  ? (viewing.month === 0 ? viewing.year - 1 : viewing.year)
                  : cell.kind === "next"
                  ? (viewing.month === 11 ? viewing.year + 1 : viewing.year)
                  : viewing.year,
                cell.kind === "prev"
                  ? (viewing.month === 0 ? 11 : viewing.month - 1)
                  : cell.kind === "next"
                  ? (viewing.month === 11 ? 0 : viewing.month + 1)
                  : viewing.month,
                cell.day
              );
              const isSelected = !!selected && isSameDay(cellDate, selected);
              const isToday    = isSameDay(cellDate, today);

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (cell.kind === "prev") {
                      prevMonth();
                      onChange(toISO(cellDate));
                      setOpen(false);
                    } else if (cell.kind === "next") {
                      nextMonth();
                      onChange(toISO(cellDate));
                      setOpen(false);
                    } else {
                      selectDay(cell.day);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-center h-7 w-full rounded-[7px] text-[11px] font-medium transition-all cursor-pointer border-0",
                    isSelected
                      ? "text-white"
                      : isToday
                      ? "font-bold text-[var(--color-cyan)] hover:bg-white/[0.07]"
                      : isCur
                      ? "text-[var(--color-f2)] hover:bg-white/[0.07]"
                      : "text-[var(--color-f4)] opacity-35 hover:bg-white/[0.07]"
                  )}
                  style={isSelected
                    ? { background: "var(--color-cyan)" }
                    : isToday && !isSelected
                    ? { border: "1px solid var(--color-cyan-border)" }
                    : undefined
                  }
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--color-border2)]">
            <button
              type="button"
              onClick={clearDate as unknown as React.MouseEventHandler<HTMLButtonElement>}
              className="text-[11px] font-medium text-[var(--color-cyan)] hover:opacity-70 transition-opacity cursor-pointer border-0 bg-transparent"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={goToday}
              className="text-[11px] font-medium text-[var(--color-cyan)] hover:opacity-70 transition-opacity cursor-pointer border-0 bg-transparent"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  height?: number;
  fontSize?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Select({
  value,
  onChange,
  options,
  placeholder = "Selecionar...",
  height = 38,
  fontSize = 13,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.value === value);

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

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] px-3 outline-none transition-all cursor-pointer"
        style={{
          height,
          fontSize,
          borderColor: open ? "var(--color-cyan-border)" : undefined,
          color: selected ? "var(--color-f1)" : "var(--color-f4)",
        }}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <IconChevronDown
          size={12}
          className="text-[var(--color-f4)] shrink-0 transition-transform duration-150"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 rounded-[10px] overflow-hidden"
          style={{
            background: "var(--color-bg3)",
            border: "1px solid var(--color-border2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-2 transition-colors cursor-pointer border-0 bg-transparent",
                opt.value === value
                  ? "text-[var(--color-cyan)] bg-[rgba(34,211,238,0.08)]"
                  : "text-[var(--color-f2)] hover:bg-white/[0.05]"
              )}
              style={{ fontSize }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

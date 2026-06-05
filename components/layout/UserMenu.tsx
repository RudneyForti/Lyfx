"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { IconUser, IconLogout, IconChevronDown } from "@tabler/icons-react";
import { logout } from "@/app/login/actions";

interface Props {
  name: string;
  avatar: string | null;
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

export function UserMenu({ name, avatar }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="fixed top-4 right-5 z-50">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-[var(--color-bg2)] border border-[var(--color-border2)] rounded-full pl-1 pr-2.5 py-1 hover:border-[var(--color-cyan-border)] transition-all cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
        style={{ borderColor: open ? "var(--color-cyan-border)" : undefined }}
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full overflow-hidden border border-[var(--color-cyan-border)] flex items-center justify-center flex-shrink-0">
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[var(--color-cyan-dim)] flex items-center justify-center text-[10px] font-semibold text-[var(--color-cyan)]">
              {getInitials(name)}
            </div>
          )}
        </div>
        <span className="text-[12px] font-medium text-[var(--color-f2)] max-w-[120px] truncate hidden sm:block">
          {name.split(" ")[0]}
        </span>
        <IconChevronDown
          size={12}
          className="text-[var(--color-f4)] transition-transform duration-150"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 w-[200px] bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <div className="text-[13px] font-semibold text-[var(--color-f1)] truncate">{name}</div>
            <div className="text-[10px] text-[var(--color-f4)] mt-0.5">Conta pessoal</div>
          </div>

          {/* Actions */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-[var(--color-f2)] hover:bg-white/[0.05] hover:text-[var(--color-f1)] transition-colors no-underline cursor-pointer"
            >
              <IconUser size={14} className="text-[var(--color-f4)]" />
              Editar perfil
            </Link>
            <button
              type="button"
              onClick={() => startTransition(() => logout())}
              disabled={isPending}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-[var(--color-red)] hover:bg-[var(--color-red-dim)] transition-colors cursor-pointer disabled:opacity-50"
            >
              <IconLogout size={14} />
              {isPending ? "Saindo…" : "Sair"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

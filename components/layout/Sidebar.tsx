"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  IconLayoutDashboard,
  IconArrowsExchange,
  IconWallet,
  IconTarget,
  IconChartLine,
  IconCalendarDue,
  IconBook2,
  IconReportAnalytics,
  IconTags,
  IconCalendarMonth,
  IconHeartRateMonitor,
  IconTrendingDown,
  IconReceipt2,
  IconBuildingBank,
  IconBell,
  IconHome2,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface Props {
  collapsed?: boolean;
}

const navGroups = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard",    label: "Dashboard",   icon: IconLayoutDashboard },
      { href: "/transactions", label: "Transações",  icon: IconArrowsExchange },
    ],
  },
  {
    label: "Planejamento",
    items: [
      { href: "/planning",       label: "Plano Mensal",   icon: IconCalendarMonth },
      { href: "/budget",         label: "Orçamento",      icon: IconWallet },
      { href: "/goals",          label: "Metas",          icon: IconTarget },
      { href: "/liabilities",    label: "Passivos",       icon: IconTrendingDown },
      { href: "/projections",    label: "Projeções",      icon: IconChartLine },
      { href: "/fixed-expenses", label: "Contas fixas",   icon: IconCalendarDue },
      { href: "/institutions",   label: "Instituições",   icon: IconBuildingBank },
      { href: "/assets",         label: "Bens e Imóveis", icon: IconHome2 },
    ],
  },
  {
    label: "Análise",
    items: [
      { href: "/alerts",         label: "Alertas",          icon: IconBell },
      { href: "/reports",        label: "Relatórios",       icon: IconReportAnalytics },
      { href: "/health",         label: "Saúde financeira", icon: IconHeartRateMonitor },
      { href: "/reimbursements", label: "Reembolsos",       icon: IconReceipt2 },
      { href: "/tags",           label: "Minhas tags",      icon: IconTags },
    ],
  },
  {
    label: "Aprender",
    items: [
      { href: "/education", label: "Educação", icon: IconBook2 },
    ],
  },
];

export function Sidebar(_props: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 bottom-0 z-50 flex flex-col transition-all duration-200",
        "bg-[var(--color-bg2)] border-r border-[var(--color-border)]",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Header — toggle collapse */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expandir" : "Colapsar"}
        className={cn(
          "flex items-center border-b border-[var(--color-border)] overflow-hidden flex-shrink-0 cursor-pointer",
          "hover:bg-[rgba(255,255,255,0.03)] transition-colors duration-150",
          collapsed ? "justify-center px-0 py-4" : "px-5 py-[18px]"
        )}
      >
        {collapsed ? (
          <div className="w-8 h-8 rounded-[8px] bg-[var(--color-cyan-dim)] border border-[var(--color-cyan-border)] flex items-center justify-center flex-shrink-0">
            <span className="font-[family-name:var(--font-display)] italic text-[11px] font-bold text-[var(--color-cyan)]">
              f(x)
            </span>
          </div>
        ) : (
          <div className="font-[family-name:var(--font-display)] italic text-[22px] font-bold text-[var(--color-f1)] leading-none">
            Ly<span className="text-[var(--color-cyan)]">fx</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2.5">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <div
              className={cn(
                "text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] px-2 mb-1 whitespace-nowrap overflow-hidden transition-opacity duration-200",
                collapsed && "opacity-0"
              )}
            >
              {group.label}
            </div>
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group flex items-center gap-2 px-2.5 py-[7px] rounded-[10px] mb-px",
                    "text-[12.5px] cursor-pointer no-underline whitespace-nowrap overflow-hidden",
                    "border transition-all duration-150 relative",
                    active
                      ? "text-[var(--color-cyan)] bg-[var(--color-cyan-faint)] border-[var(--color-cyan-border)]"
                      : "text-[var(--color-f3)] border-transparent hover:text-[var(--color-f2)] hover:bg-white/[0.04]"
                  )}
                  title={collapsed ? label : undefined}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  <span
                    className={cn(
                      "overflow-hidden transition-all duration-200",
                      collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[160px]"
                    )}
                  >
                    {label}
                  </span>
                  {collapsed && (
                    <div className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 bg-[var(--color-bg4)] border border-[var(--color-border2)] rounded-[6px] px-2.5 py-1 text-[11px] text-[var(--color-f1)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-100 z-50">
                      {label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}

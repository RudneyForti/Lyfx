"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ALL_MODULES } from "@/lib/modules";
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
  IconCar,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface Props {
  collapsed?: boolean;
  allowedModules?: string[]; // if provided, filter nav items by module key
  betaModules?: string[];    // runtime beta overrides from AppConfig (undefined = use static ALL_MODULES.isBeta)
}

const navGroups = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard",    label: "Dashboard",   icon: IconLayoutDashboard, moduleKey: "dashboard" },
      { href: "/transactions", label: "Transações",  icon: IconArrowsExchange,  moduleKey: "transactions" },
    ],
  },
  {
    label: "Planejamento",
    items: [
      { href: "/planning",       label: "Plano Mensal",   icon: IconCalendarMonth, moduleKey: "monthly-plan" },
      { href: "/budget",         label: "Orçamento",      icon: IconWallet,        moduleKey: "budget" },
      { href: "/goals",          label: "Metas",          icon: IconTarget,        moduleKey: "goals" },
      { href: "/liabilities",    label: "Passivos",       icon: IconTrendingDown,  moduleKey: "liabilities" },
      { href: "/projections",    label: "Projeções",      icon: IconChartLine,     moduleKey: "projections" },
      { href: "/fixed-expenses", label: "Contas fixas",   icon: IconCalendarDue,   moduleKey: "fixed-expenses" },
      { href: "/institutions",   label: "Instituições",   icon: IconBuildingBank,  moduleKey: "institutions" },
      { href: "/assets",         label: "Bens e Imóveis", icon: IconHome2,         moduleKey: "assets" },
    ],
  },
  {
    label: "Análise",
    items: [
      { href: "/alerts",         label: "Alertas e Notificações", icon: IconBell,        moduleKey: "alerts" },
      { href: "/reports",        label: "Relatórios",       icon: IconReportAnalytics,  moduleKey: "reports" },
      { href: "/health",         label: "Saúde financeira", icon: IconHeartRateMonitor, moduleKey: "health" },
      { href: "/reimbursements",    label: "Reembolsos",    icon: IconReceipt2, moduleKey: "reimbursements" },
      { href: "/km-reimbursement", label: "Reembolso Especial", icon: IconCar, moduleKey: "km-reimbursement" },
      { href: "/tags",             label: "Minhas tags",   icon: IconTags,     moduleKey: "tags" },
    ],
  },
  {
    label: "Aprender",
    items: [
      { href: "/education", label: "Educação", icon: IconBook2, moduleKey: "education" },
    ],
  },
];

export function Sidebar({ allowedModules, betaModules }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // If allowedModules is provided, filter items; otherwise show all
  const visibleGroups = navGroups.map(group => ({
    ...group,
    items: allowedModules
      ? group.items.filter(item => allowedModules.includes(item.moduleKey))
      : group.items,
  })).filter(group => group.items.length > 0);

  useEffect(() => {
    // 12px left margin + sidebar width + 12px gap to content
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "84px" : "244px"
    );
  }, [collapsed]);

  return (
    <nav
      className={cn(
        "fixed top-3 left-3 bottom-3 z-50 flex flex-col transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}
      style={{
        background: "rgba(18,18,18,0.92)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 18,
        boxShadow: "0 4px 40px rgba(0,0,0,0.5)",
        overflow: "hidden",
      }}
    >
      {/* Header — toggle collapse */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expandir" : "Colapsar"}
        className={cn(
          "flex items-center border-b border-[rgba(255,255,255,0.07)] flex-shrink-0 cursor-pointer",
          "hover:bg-[rgba(255,255,255,0.03)] transition-colors duration-150",
          collapsed ? "justify-center px-0 py-4" : "px-5 py-[18px]"
        )}
      >
        {collapsed ? (
          <div className="w-8 h-8 rounded-[12px] bg-[var(--color-cyan-dim)] border border-[var(--color-cyan-border)] flex items-center justify-center flex-shrink-0">
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
      <div className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-3 pb-5",
        // scrollbar fino dentro do container — não é clipado pelo overflow:hidden do nav
        "[&::-webkit-scrollbar]:w-[3px]",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:bg-[rgba(255,255,255,0.12)]",
        "[&::-webkit-scrollbar-thumb]:rounded-full",
        "[&::-webkit-scrollbar-thumb:hover]:bg-[rgba(255,255,255,0.25)]",
      )}>
        {visibleGroups.map((group) => (
          <div key={group.label} className={cn("mb-4", collapsed && "mb-1")}>
            <div
              className={cn(
                "text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] px-2 mb-1 whitespace-nowrap overflow-hidden transition-all duration-200",
                collapsed ? "opacity-0 max-h-0 mb-0" : "opacity-100 max-h-[20px]"
              )}
            >
              {group.label}
            </div>
            {group.items.map(({ href, label, icon: Icon, moduleKey }) => {
              const active = pathname === href;
              const isBeta = betaModules
                ? betaModules.includes(moduleKey)
                : ALL_MODULES.find(m => m.key === moduleKey)?.isBeta;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group flex items-center gap-2 px-2.5 py-[7px] rounded-[12px] mb-px",
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
                  {!collapsed && isBeta && (
                    <span style={{
                      fontSize: 8, padding: "1px 5px", borderRadius: 999, flexShrink: 0,
                      background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)",
                      color: "#FBBF24", fontWeight: 700, letterSpacing: 0.3, lineHeight: 1,
                    }}>
                      Beta
                    </span>
                  )}
                  {collapsed && (
                    <div className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 bg-[var(--color-bg4)] border border-[var(--color-border2)] rounded-[6px] px-2.5 py-1 text-[11px] text-[var(--color-f1)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-100 z-50">
                      {label}{isBeta ? " (Beta)" : ""}
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

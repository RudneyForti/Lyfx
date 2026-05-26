// Canonical module list — single source of truth
// The key matches the href segment used in Sidebar.tsx

export type ModuleKey =
  | "dashboard"
  | "transactions"
  | "budget"
  | "goals"
  | "projections"
  | "fixed-expenses"
  | "monthly-plan"
  | "liabilities"
  | "institutions"
  | "assets"
  | "alerts"
  | "health"
  | "reports"
  | "reimbursements"
  | "tags"
  | "profile"
  | "education";

export interface ModuleDefinition {
  key: ModuleKey;
  label: string;
  group: "Principal" | "Planejamento" | "Análise" | "Aprender";
}

export const ALL_MODULES: ModuleDefinition[] = [
  // Principal
  { key: "dashboard",       label: "Dashboard",       group: "Principal" },
  { key: "transactions",    label: "Transações",       group: "Principal" },

  // Planejamento
  { key: "budget",          label: "Orçamento",        group: "Planejamento" },
  { key: "goals",           label: "Metas",            group: "Planejamento" },
  { key: "projections",     label: "Projeções",        group: "Planejamento" },
  { key: "fixed-expenses",  label: "Contas Fixas",     group: "Planejamento" },
  { key: "monthly-plan",    label: "Plano Mensal",     group: "Planejamento" },
  { key: "liabilities",     label: "Passivos",         group: "Planejamento" },
  { key: "institutions",    label: "Instituições",     group: "Planejamento" },
  { key: "assets",          label: "Bens e Imóveis",   group: "Planejamento" },

  // Análise
  { key: "alerts",          label: "Alertas",          group: "Análise" },
  { key: "health",          label: "Saúde Financeira", group: "Análise" },
  { key: "reports",         label: "Relatórios",       group: "Análise" },
  { key: "reimbursements",  label: "Reembolsos",       group: "Análise" },
  { key: "tags",            label: "Tags",             group: "Análise" },

  // Aprender
  { key: "education",       label: "Educação",         group: "Aprender" },

  // Perfil — sempre acessível, não é controlado por plano
  { key: "profile",         label: "Perfil",           group: "Principal" },
];

export const ALL_MODULE_KEYS: ModuleKey[] = ALL_MODULES.map((m) => m.key);

// Modules that are always accessible regardless of plan (meta-modules)
export const ALWAYS_ACCESSIBLE: ModuleKey[] = ["profile"];

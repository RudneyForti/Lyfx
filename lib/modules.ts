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
  | "km-reimbursement"
  | "tags"
  | "profile"
  | "education";

export interface ModuleDefinition {
  key: ModuleKey;
  label: string;
  group: "Principal" | "Planejamento" | "Análise" | "Aprender";
  /** One-line description shown in the Modules tab and future tooltips */
  summary: string;
  /** Marks features still under active development */
  isBeta?: boolean;
}

export const ALL_MODULES: ModuleDefinition[] = [
  // Principal
  { key: "dashboard",      label: "Dashboard",       group: "Principal",    summary: "Visão geral das suas finanças — saldo, fluxo e alertas do mês." },
  { key: "transactions",   label: "Transações",       group: "Principal",    summary: "Registre e categorize receitas e despesas do dia a dia." },

  // Planejamento
  { key: "budget",         label: "Orçamento",        group: "Planejamento", summary: "Defina limites por categoria e acompanhe o percentual do mês." },
  { key: "goals",          label: "Metas",            group: "Planejamento", summary: "Crie objetivos financeiros com meta de valor e prazo definidos." },
  { key: "projections",    label: "Projeções",        group: "Planejamento", summary: "Simule cenários de patrimônio futuro baseados no histórico.", isBeta: true },
  { key: "fixed-expenses", label: "Contas Fixas",     group: "Planejamento", summary: "Gerencie despesas recorrentes e seus vencimentos mensais." },
  { key: "monthly-plan",   label: "Plano Mensal",     group: "Planejamento", summary: "Monte o planejamento financeiro mês a mês com projeção de saldo.", isBeta: true },
  { key: "liabilities",    label: "Passivos",         group: "Planejamento", summary: "Controle dívidas, financiamentos e parcelamentos ativos." },
  { key: "institutions",   label: "Instituições",     group: "Planejamento", summary: "Organize bancos e corretoras com saldos por conta." },
  { key: "assets",         label: "Bens e Imóveis",   group: "Planejamento", summary: "Registre bens, imóveis e veículos com valor de compra e atual.", isBeta: true },

  // Análise
  { key: "alerts",         label: "Alertas",          group: "Análise",      summary: "Notificações automáticas quando gastos ultrapassam o limite.", isBeta: true },
  { key: "health",         label: "Saúde Financeira", group: "Análise",      summary: "Score e diagnóstico da sua situação financeira geral." },
  { key: "reports",        label: "Relatórios",       group: "Análise",      summary: "Relatórios detalhados com gráficos por período e categoria." },
  { key: "reimbursements",    label: "Reembolsos",      group: "Análise",      summary: "Controle gastos a serem reembolsados por terceiros.", isBeta: true },
  { key: "km-reimbursement", label: "Reembolso KM",   group: "Análise",      summary: "Controle de reembolso de quilometragem com cálculo automático e D+5.", isBeta: true },
  { key: "tags",              label: "Tags",           group: "Análise",      summary: "Etiquete transações com tags personalizadas para análise." },

  // Aprender
  { key: "education",      label: "Educação",         group: "Aprender",     summary: "Pílulas de educação financeira gamificadas e progressivas.", isBeta: true },

  // Perfil — sempre acessível, não é controlado por plano
  { key: "profile",        label: "Perfil",           group: "Principal",    summary: "Configurações da conta, avatar e preferências pessoais." },
];

export const ALL_MODULE_KEYS: ModuleKey[] = ALL_MODULES.map((m) => m.key);

// Modules that are always accessible regardless of plan (meta-modules)
export const ALWAYS_ACCESSIBLE: ModuleKey[] = ["profile"];

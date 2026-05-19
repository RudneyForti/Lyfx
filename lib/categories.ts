import { TransactionCategory } from "./types";

export interface CategoryDef {
  value: TransactionCategory;
  label: string;
  group: "credit" | "debit";
  groupLabel: string;
  examples: string;
}

export const CATEGORIES: CategoryDef[] = [
  // ── CRÉDITOS
  {
    value: "credit_fixed",
    label: "Fixo",
    group: "credit",
    groupLabel: "Receitas",
    examples: "Salário, pró-labore",
  },
  {
    value: "credit_variable",
    label: "Variável",
    group: "credit",
    groupLabel: "Receitas",
    examples: "Freelas, reembolsos, vendas",
  },
  // ── DÉBITOS
  {
    value: "debit_fixed",
    label: "Fixo",
    group: "debit",
    groupLabel: "Despesas",
    examples: "Aluguel, condomínio, assinaturas",
  },
  {
    value: "debit_variable",
    label: "Variável",
    group: "debit",
    groupLabel: "Despesas",
    examples: "Alimentação, combustível, lazer",
  },
  {
    value: "debit_committed",
    label: "Comprometido",
    group: "debit",
    groupLabel: "Despesas",
    examples: "Parcelas de cartão, cheque especial",
  },
  {
    value: "debit_longterm",
    label: "Longo Prazo",
    group: "debit",
    groupLabel: "Despesas",
    examples: "Consignado, financiamentos",
  },
  {
    value: "debit_seasonal",
    label: "Sazonal",
    group: "debit",
    groupLabel: "Despesas",
    examples: "IPVA, seguro, natal, revisão",
  },
  {
    value: "debit_unexpected",
    label: "Imprevisível",
    group: "debit",
    groupLabel: "Despesas",
    examples: "Emergências, imprevistos",
  },
  {
    value: "debit_intentional",
    label: "Alocação Intencional",
    group: "debit",
    groupLabel: "Despesas",
    examples: "Reserva, quitação de dívida, investimento",
  },
];

export const CREDIT_CATEGORIES = CATEGORIES.filter((c) => c.group === "credit");
export const DEBIT_CATEGORIES = CATEGORIES.filter((c) => c.group === "debit");

export function getCategoryDef(value: TransactionCategory): CategoryDef {
  return CATEGORIES.find((c) => c.value === value)!;
}

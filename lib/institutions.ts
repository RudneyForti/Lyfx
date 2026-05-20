export type InstitutionType = "bank" | "fintech" | "broker" | "other";
export type AccountType = "checking" | "savings" | "credit_card" | "investment" | "wallet" | "other";

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  bank: "Banco",
  fintech: "Fintech",
  broker: "Corretora",
  other: "Outro",
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  credit_card: "Cartão de crédito",
  investment: "Investimentos",
  wallet: "Carteira / dinheiro",
  other: "Outro",
};

export interface Institution {
  id: string;
  userId: string;
  name: string;
  type: string;
  color: string;
  icon: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  accounts: Account[];
}

export interface Account {
  id: string;
  userId: string;
  institutionId: string;
  name: string;
  type: string;
  balance: number;
  limit: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountForSelect {
  id: string;
  name: string;
  type: string;
  institutionName: string;
}

export type TransactionType = "credit" | "debit";
export type Recurrence = "once" | "monthly" | "yearly";
export type TransactionContext = "personal" | "professional";

export interface Tag {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
}

export type CreditCategory =
  | "credit_fixed"
  | "credit_variable";

export type DebitCategory =
  | "debit_fixed"
  | "debit_variable"
  | "debit_committed"
  | "debit_longterm"
  | "debit_seasonal"
  | "debit_unexpected"
  | "debit_intentional";

export type TransactionCategory = CreditCategory | DebitCategory;

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  subcategory?: string | null;
  notes?: string | null;
  recurrence: Recurrence;
  recurrenceEndsAt?: Date | null;
  installmentGroupId?: string | null;
  installmentNumber?: number | null;
  installmentTotal?: number | null;
  context?: string | null;
  reimbursable?: boolean;
  reimbursedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags?: Tag[];
}

export interface ProjectedTransaction extends Omit<Transaction, "createdAt" | "updatedAt"> {
  isProjected: true;
  sourceId: string; // id of the original transaction
}

export interface DRESummary {
  credits: {
    fixed: number;
    variable: number;
    total: number;
  };
  debits: {
    fixed: number;
    variable: number;
    committed: number;
    longterm: number;
    seasonal: number;
    unexpected: number;
    intentional: number;
    total: number;
  };
  margins: {
    afterFixed: number;      // receita − debit_fixed
    afterVariable: number;   // afterFixed − debit_variable
    afterCommitted: number;  // afterVariable − debit_committed (resultado operacional)
    net: number;             // resultado final
  };
  saved: number;   // debit_longterm — quanto foi alocado para longo prazo
  result: number;
}

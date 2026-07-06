export type AssetType = "real_estate" | "vehicle" | "other";
export type AssetExpenseType =
  | "iptu" | "ipva" | "itr" | "dpvat" | "seguro"
  | "licenciamento" | "manutencao" | "other";

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  real_estate: "Imóvel",
  vehicle:     "Veículo",
  other:       "Outro bem",
};

export const ASSET_EXPENSE_TYPE_LABELS: Record<AssetExpenseType, string> = {
  iptu:          "IPTU",
  ipva:          "IPVA",
  itr:           "ITR",
  dpvat:         "DPVAT / SPVAT",
  seguro:        "Seguro",
  licenciamento: "Licenciamento",
  manutencao:    "Manutenção",
  other:         "Outro",
};

// Pre-suggested expenses per asset type
export const EXPENSE_SUGGESTIONS: Record<AssetType, AssetExpenseType[]> = {
  real_estate: ["iptu", "seguro", "manutencao", "itr", "other"],
  vehicle:     ["ipva", "dpvat", "licenciamento", "seguro", "manutencao", "other"],
  other:       ["seguro", "manutencao", "other"],
};

export interface Asset {
  id:              string;
  userId:          string;
  name:            string;
  type:            string;
  propertyAddress: string | null;
  make:            string | null;
  model:           string | null;
  year:            number | null;
  plate:           string | null;
  purchaseValue:   number | null;
  currentValue:    number | null;
  purchaseDate:    Date | null;
  notes:           string | null;
  createdAt:       Date;
  updatedAt:       Date;
  expenses:        AssetExpense[];
}

export interface AssetExpense {
  id:        string;
  userId:    string;
  assetId:   string;
  name:      string;
  type:      string;
  amount:    number;
  dueDate:   Date | null;
  paid:      boolean;
  paidAt:    Date | null;
  notes:     string | null;
  createdAt: Date;
  updatedAt: Date;
}

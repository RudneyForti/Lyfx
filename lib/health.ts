import { DRESummary } from "./types";

export type HealthProfile =
  | "em-recuperacao"
  | "estabilizado"
  | "em-construcao"
  | "livre";

export interface HealthDimension {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  pct: number;           // 0-100, for the progress bar
  valueLabel: string;    // "38% da receita em fixos + parcelas"
  idealLabel: string;    // "ideal: ≤ 50%"
  status: "great" | "good" | "warning" | "critical";
}

export interface HealthScore {
  total: number;
  profile: HealthProfile;
  profileLabel: string;
  profileColor: string;
  dimensions: HealthDimension[];
  nextThreshold: number | null;   // pontos até o próximo perfil
  nextProfileLabel: string | null;
  tip: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function statusFor(score: number, max: number): HealthDimension["status"] {
  const r = score / max;
  if (r >= 0.85) return "great";
  if (r >= 0.60) return "good";
  if (r >= 0.30) return "warning";
  return "critical";
}

export function computeHealthScore(
  summary: DRESummary,
  reserveMonths: number,
): HealthScore {
  const income = summary.credits.total;

  if (income === 0) {
    return {
      total: 0,
      profile: "em-recuperacao",
      profileLabel: "Em Recuperação",
      profileColor: "#F87171",
      dimensions: [],
      nextThreshold: 40,
      nextProfileLabel: "Estabilizado",
      tip: "Registre suas receitas para calcular o score de saúde.",
    };
  }

  // ── 1. Comprometimento (30 pts) ─────────────────────────────────
  // (fixo + parcelas) / receita
  const commitAmt = summary.debits.fixed + summary.debits.committed;
  const commitPct = commitAmt / income;
  let commitScore: number;
  if (commitPct <= 0.30)      commitScore = 30;
  else if (commitPct <= 0.50) commitScore = 20;
  else if (commitPct <= 0.65) commitScore = 10;
  else                        commitScore = 0;

  const commitDim: HealthDimension = {
    key: "commitment",
    label: "Comprometimento",
    score: commitScore,
    maxScore: 30,
    pct: Math.min(commitPct * 100, 100),
    valueLabel: `${(commitPct * 100).toFixed(0)}% da receita em fixos + parcelas`,
    idealLabel: "ideal: ≤ 50%",
    status: statusFor(commitScore, 30),
  };

  // ── 2. Poupança (25 pts) ────────────────────────────────────────
  // debit_longterm / receita
  const savingsPct = summary.debits.longterm / income;
  let savingsScore: number;
  if (savingsPct >= 0.20)      savingsScore = 25;
  else if (savingsPct >= 0.10) savingsScore = 18;
  else if (savingsPct >= 0.05) savingsScore = 10;
  else if (savingsPct > 0)     savingsScore = 5;
  else                         savingsScore = 0;

  const savingsDim: HealthDimension = {
    key: "savings",
    label: "Taxa de poupança",
    score: savingsScore,
    maxScore: 25,
    pct: Math.min(savingsPct * 100 / 20 * 100, 100), // 20% = full bar
    valueLabel: `${(savingsPct * 100).toFixed(0)}% da receita para longo prazo`,
    idealLabel: "ideal: ≥ 10%",
    status: statusFor(savingsScore, 25),
  };

  // ── 3. Resultado do mês (25 pts) ────────────────────────────────
  const resultRatio = summary.result / income;
  let resultScore: number;
  if (resultRatio >= 0.10)      resultScore = 25;
  else if (resultRatio >= 0.05) resultScore = 18;
  else if (resultRatio > 0)     resultScore = 10;
  else if (resultRatio === 0)   resultScore = 5;
  else                          resultScore = 0;

  const resultDim: HealthDimension = {
    key: "result",
    label: "Resultado do mês",
    score: resultScore,
    maxScore: 25,
    pct: resultRatio > 0 ? Math.min(resultRatio / 0.10 * 100, 100) : 0,
    valueLabel: summary.result >= 0
      ? `+${fmt(summary.result)} positivo`
      : `−${fmt(Math.abs(summary.result))} negativo`,
    idealLabel: "ideal: ≥ +10% da receita",
    status: statusFor(resultScore, 25),
  };

  // ── 4. Fundo de reserva (20 pts) ────────────────────────────────
  let reserveScore: number;
  if (reserveMonths >= 6)      reserveScore = 20;
  else if (reserveMonths >= 3) reserveScore = 13;
  else if (reserveMonths >= 1) reserveScore = 7;
  else                         reserveScore = 0;

  const reserveDim: HealthDimension = {
    key: "reserve",
    label: "Fundo de reserva",
    score: reserveScore,
    maxScore: 20,
    pct: Math.min((reserveMonths / 6) * 100, 100),
    valueLabel: reserveMonths >= 0.1
      ? `~${reserveMonths.toFixed(1)} meses de cobertura`
      : "Sem alocações de longo prazo registradas",
    idealLabel: "meta: 6 meses de despesas",
    status: statusFor(reserveScore, 20),
  };

  const total = commitScore + savingsScore + resultScore + reserveScore;

  // ── Perfil ──────────────────────────────────────────────────────
  let profile: HealthProfile;
  let profileLabel: string;
  let profileColor: string;
  if (total >= 80)      { profile = "livre";            profileLabel = "Livre";           profileColor = "#4ADE80"; }
  else if (total >= 60) { profile = "em-construcao";    profileLabel = "Em Construção";   profileColor = "#22D3EE"; }
  else if (total >= 40) { profile = "estabilizado";     profileLabel = "Estabilizado";    profileColor = "#FBBF24"; }
  else                  { profile = "em-recuperacao";   profileLabel = "Em Recuperação";  profileColor = "#F87171"; }

  // ── Próximo perfil ──────────────────────────────────────────────
  const nextThresholds: Record<HealthProfile, { gap: number; label: string } | null> = {
    "em-recuperacao": { gap: 40 - total, label: "Estabilizado" },
    "estabilizado":   { gap: 60 - total, label: "Em Construção" },
    "em-construcao":  { gap: 80 - total, label: "Livre" },
    "livre":          null,
  };
  const next = nextThresholds[profile];

  // ── Dica ────────────────────────────────────────────────────────
  const dims = [commitDim, savingsDim, resultDim, reserveDim];
  const worst = dims.reduce((a, b) =>
    (a.score / a.maxScore) <= (b.score / b.maxScore) ? a : b
  );

  let tip: string;
  if (worst.key === "commitment" && commitScore < 20) {
    tip = `Sua carga comprometida está em ${(commitPct * 100).toFixed(0)}%. Priorize quitar parcelas para recuperar margem e ganhar ${30 - commitScore} pts nesta dimensão.`;
  } else if (worst.key === "savings" && savingsScore < 18) {
    const needed = Math.round(income * 0.10 - summary.debits.longterm);
    tip = needed > 0
      ? `Aumentar a alocação de longo prazo em ${fmt(needed)}/mês atingiria os 10% recomendados e adicionaria até ${18 - savingsScore} pts.`
      : "Você já atingiu 10% de poupança. Aumente para 20% para maximizar o score.";
  } else if (worst.key === "result" && resultScore < 18) {
    tip = summary.result < 0
      ? "Resultado negativo sinaliza gastos acima da receita. Revise despesas variáveis — são o ponto de maior controle."
      : "Resultado positivo, mas a margem ainda é baixa. Reduzir despesas variáveis melhora essa dimensão.";
  } else if (worst.key === "reserve") {
    tip = `Seu fundo cobre ~${reserveMonths.toFixed(1)} meses. Cada mês que você aloca em longo prazo aproxima da meta de 6 meses.`;
  } else {
    tip = "Finanças saudáveis. Continue o ritmo de poupança e mantenha as despesas comprometidas abaixo de 50% da receita.";
  }

  return {
    total,
    profile,
    profileLabel,
    profileColor,
    dimensions: [commitDim, savingsDim, resultDim, reserveDim],
    nextThreshold: next?.gap ?? null,
    nextProfileLabel: next?.label ?? null,
    tip,
  };
}

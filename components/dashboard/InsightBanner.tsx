import { DRESummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { IconBulb, IconAlertTriangle, IconTrendingUp } from "@tabler/icons-react";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
}

interface Props {
  summary: DRESummary;
  goals: Goal[];
}

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function generateInsight(summary: DRESummary, goals: Goal[]): {
  text: string;
  type: "warning" | "tip" | "positive";
} {
  const { credits, debits, margins, result, saved } = summary;

  // 1. Resultado negativo
  if (result < 0) {
    return {
      type: "warning",
      text: `Seus gastos superam a receita em ${fmt(Math.abs(result))} este mês. Revise as despesas variáveis primeiro — elas são o ponto de maior controle.`,
    };
  }

  // 2. Comprometido alto (>35% da receita)
  const committedRatio = credits.total > 0 ? debits.committed / credits.total : 0;
  if (committedRatio > 0.35) {
    return {
      type: "warning",
      text: `${(committedRatio * 100).toFixed(0)}% da sua receita está comprometida com parcelas. Priorize quitar as de maior juros para recuperar margem.`,
    };
  }

  // 3. Meta ativa com saldo livre disponível
  const activeGoals = goals.filter((g) => g.status === "active");
  if (activeGoals.length > 0 && result > 0) {
    const goal = activeGoals[0];
    const extra = Math.round(result * 0.2);
    if (extra > 0) {
      return {
        type: "tip",
        text: `Redirecionar ${fmt(extra)} do saldo livre para "${goal.name}" te deixa mais perto da meta sem impactar o orçamento.`,
      };
    }
  }

  // 4. Taxa de poupança baixa
  const saveRate = credits.total > 0 ? saved / credits.total : 0;
  if (result > 0 && saveRate < 0.1) {
    return {
      type: "tip",
      text: `Você está guardando ${(saveRate * 100).toFixed(0)}% da renda. Redirecionar mais ${fmt(Math.round(credits.total * 0.1 - saved))} para longo prazo atingiria os 10% recomendados.`,
    };
  }

  // 5. Mês positivo com boa poupança
  if (result > 0 && saveRate >= 0.1) {
    return {
      type: "positive",
      text: `Mês saudável. Você guardou ${(saveRate * 100).toFixed(0)}% da renda e ficou ${fmt(result)} no positivo. Continue esse ritmo.`,
    };
  }

  return {
    type: "tip",
    text: "Registre suas transações regularmente para insights mais precisos.",
  };
}

export function InsightBanner({ summary, goals }: Props) {
  const insight = generateInsight(summary, goals);

  const styles = {
    warning: {
      bg: "var(--color-red-dim)",
      border: "var(--color-red-border)",
      text: "var(--color-red)",
      Icon: IconAlertTriangle,
    },
    tip: {
      bg: "var(--color-cyan-dim)",
      border: "var(--color-cyan-border)",
      text: "var(--color-cyan)",
      Icon: IconBulb,
    },
    positive: {
      bg: "var(--color-green-dim)",
      border: "var(--color-green-border)",
      text: "var(--color-green)",
      Icon: IconTrendingUp,
    },
  };

  const s = styles[insight.type];
  const Icon = s.Icon;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5 rounded-[12px] border"
      style={{ background: s.bg, borderColor: s.border }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: `color-mix(in srgb, ${s.text} 15%, transparent)` }}
      >
        <Icon size={13} style={{ color: s.text }} />
      </div>
      <div>
        <span className="text-[11px] font-semibold" style={{ color: s.text }}>
          Lyfx Insight{" "}
        </span>
        <span className="text-[12px]" style={{ color: "var(--color-f2)" }}>
          {insight.text}
        </span>
      </div>
    </div>
  );
}

import Link from "next/link";
import { IconTarget, IconArrowRight } from "@tabler/icons-react";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  status: string;
}

interface Props {
  goals: Goal[];
}

export function GoalsMiniWidget({ goals }: Props) {
  const active = goals.filter((g) => g.status === "active").slice(0, 4);

  return (
    <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[14px] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)]">
          Metas
        </div>
        <Link
          href="/goals"
          className="flex items-center gap-1 text-[10px] text-[var(--color-cyan)] hover:underline no-underline"
        >
          Ver todas <IconArrowRight size={10} />
        </Link>
      </div>

      {active.length === 0 ? (
        <div className="flex flex-col items-center py-4 gap-2">
          <IconTarget size={20} className="text-[var(--color-f4)]" />
          <div className="text-[11px] text-[var(--color-f4)] text-center">
            Nenhuma meta ativa.
          </div>
          <Link
            href="/goals"
            className="text-[11px] text-[var(--color-cyan)] hover:underline no-underline"
          >
            Criar meta
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {active.map((goal) => {
            const progress = Math.min(
              100,
              goal.targetAmount > 0
                ? (goal.currentAmount / goal.targetAmount) * 100
                : 0
            );
            return (
              <div key={goal.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] text-[var(--color-f2)] font-medium truncate max-w-[140px]">
                    {goal.name}
                  </span>
                  <span className="text-[11px] font-medium" style={{ color: goal.color }}>
                    {progress.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-bg4)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, background: goal.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

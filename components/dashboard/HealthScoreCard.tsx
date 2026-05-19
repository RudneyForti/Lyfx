import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import type { HealthScore } from "@/lib/health";

interface Props {
  healthScore: HealthScore;
}

export function HealthScoreCard({ healthScore }: Props) {
  const { total, profileLabel, profileColor, nextThreshold, nextProfileLabel } = healthScore;

  const profileBg  = `${profileColor}14`;
  const profileBdr = `${profileColor}30`;

  return (
    <Link
      href="/health"
      className="block bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[14px] px-4 py-4 hover:border-[var(--color-border2)] transition-colors no-underline group"
    >
      <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-3">
        Saúde Financeira
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        {/* Score */}
        <div className="flex items-baseline gap-1">
          <span
            className="text-[28px] font-bold font-[family-name:var(--font-display)] italic leading-none"
            style={{ color: profileColor }}
          >
            {total}
          </span>
          <span className="text-[11px] text-[var(--color-f4)]">/100</span>
        </div>

        {/* Perfil badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] border flex-shrink-0"
          style={{ background: profileBg, borderColor: profileBdr }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: profileColor }} />
          <span className="text-[10px] font-semibold" style={{ color: profileColor }}>
            {profileLabel}
          </span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="w-full h-1 bg-[var(--color-bg4)] rounded-full overflow-hidden mb-2.5">
        <div
          className="h-full rounded-full"
          style={{ width: `${total}%`, backgroundColor: profileColor }}
        />
      </div>

      {/* Rodapé */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--color-f4)]">
          {nextThreshold != null && nextProfileLabel
            ? `${nextThreshold} pts para ${nextProfileLabel}`
            : "Score máximo atingido"}
        </span>
        <span className="text-[10px] text-[var(--color-cyan)] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          Ver detalhes <IconArrowRight size={10} />
        </span>
      </div>
    </Link>
  );
}

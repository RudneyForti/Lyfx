"use client";

import { useState, useTransition } from "react";
import { IconBulb, IconPencil, IconCheck, IconX, IconLoader2 } from "@tabler/icons-react";
import type { HealthScore, HealthDimension } from "@/lib/health";
import { updateReserveBalance } from "@/app/actions/settings";
import { cn } from "@/lib/utils";

interface Props {
  healthScore: HealthScore;
  monthLabel: string;
  reserveBalance: number;
}

// ── Gauge SVG (semicírculo) ─────────────────────────────────────────────────
function ScoreGauge({ score, color }: { score: number; color: string }) {
  const r = 56;
  const cx = 70;
  const cy = 68;
  const arcLen = Math.PI * r; // comprimento do semicírculo
  const filled = (score / 100) * arcLen;
  const offset = arcLen - filled;

  return (
    <svg width="140" height="80" viewBox="0 0 140 80" className="overflow-visible">
      {/* trilha */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="var(--color-bg4)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* preenchimento */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={arcLen}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      {/* número */}
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        fill={color}
        style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-display)" }}
      >
        {score}
      </text>
      <text
        x={cx}
        y={cy + 7}
        textAnchor="middle"
        fill="var(--color-f4)"
        style={{ fontSize: 11 }}
      >
        / 100
      </text>
    </svg>
  );
}

// ── Barra de status por dimensão ────────────────────────────────────────────
const statusColors: Record<HealthDimension["status"], string> = {
  great:    "#4ADE80",
  good:     "#22D3EE",
  warning:  "#FBBF24",
  critical: "#F87171",
};

const statusLabels: Record<HealthDimension["status"], string> = {
  great:    "Ótimo",
  good:     "Bom",
  warning:  "Atenção",
  critical: "Crítico",
};

function DimensionCard({ dim, extra }: { dim: HealthDimension; extra?: React.ReactNode }) {
  const color = statusColors[dim.status];
  const label = statusLabels[dim.status];
  const scorePct = (dim.score / dim.maxScore) * 100;

  return (
    <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[14px] px-5 py-4 hover:border-[var(--color-border2)] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[12px] font-semibold text-[var(--color-f1)]">{dim.label}</div>
          <div className="text-[10px] mt-0.5" style={{ color }}>
            {label}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-[18px] font-bold font-[family-name:var(--font-display)] italic" style={{ color }}>
            {dim.score}
          </span>
          <span className="text-[11px] text-[var(--color-f4)]">/{dim.maxScore}</span>
        </div>
      </div>

      {/* Barra de pontuação */}
      <div className="w-full h-1.5 bg-[var(--color-bg4)] rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${scorePct}%`, backgroundColor: color }}
        />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--color-f3)]">{dim.valueLabel}</span>
        <span className="text-[9px] text-[var(--color-f4)]">{dim.idealLabel}</span>
      </div>

      {/* Conteúdo extra (ex: editor de reserva) */}
      {extra}
    </div>
  );
}

// ── Editor inline do saldo de reserva ──────────────────────────────────────
function ReserveBalanceEditor({ current }: { current: number }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(
    current > 0 ? current.toFixed(2).replace(".", ",") : ""
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const parsed = parseFloat(value.replace(/\./g, "").replace(",", "."));
    if (isNaN(parsed) || parsed < 0) return;
    startTransition(async () => {
      await updateReserveBalance(parsed);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <div className="flex items-center gap-1 bg-[var(--color-bg3)] border border-[var(--color-cyan-border)] rounded-[7px] px-2 py-1">
          <span className="text-[11px] text-[var(--color-f4)]">R$</span>
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
            placeholder="0,00"
            className="w-28 bg-transparent text-[12px] text-[var(--color-f1)] outline-none placeholder:text-[var(--color-f4)]"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-6 h-6 flex items-center justify-center rounded-[5px] bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-colors cursor-pointer disabled:opacity-50"
        >
          {isPending ? <IconLoader2 size={11} className="animate-spin" /> : <IconCheck size={11} />}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="w-6 h-6 flex items-center justify-center rounded-[5px] border border-[var(--color-border2)] text-[var(--color-f4)] hover:text-[var(--color-f2)] transition-colors cursor-pointer"
        >
          <IconX size={11} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 mt-2 text-[10px] text-[var(--color-f4)] hover:text-[var(--color-cyan)] transition-colors cursor-pointer group"
    >
      <IconPencil size={10} className="group-hover:text-[var(--color-cyan)]" />
      {saved
        ? <span className="text-[var(--color-green)]">Salvo ✓</span>
        : current > 0
          ? `Saldo declarado: R$ ${current.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
          : "Declarar saldo de reserva"
      }
    </button>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export function HealthView({ healthScore, monthLabel, reserveBalance }: Props) {
  const { total, profileLabel, profileColor, dimensions, nextThreshold, nextProfileLabel, tip } = healthScore;

  const profileBg  = `${profileColor}14`;
  const profileBdr = `${profileColor}30`;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Hero: perfil + gauge ── */}
      <div className="bg-[var(--color-bg2)] border border-[var(--color-border2)] rounded-[16px] px-6 py-6">
        <div className="text-[9px] font-bold tracking-[1.8px] uppercase text-[var(--color-f4)] mb-4">
          {monthLabel}
        </div>
        <div className="flex items-center justify-between gap-6">

          {/* Perfil */}
          <div>
            <div className="text-[10px] text-[var(--color-f4)] mb-2">Perfil financeiro</div>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border mb-3"
              style={{ background: profileBg, borderColor: profileBdr }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: profileColor }} />
              <span className="text-[15px] font-bold" style={{ color: profileColor }}>
                {profileLabel}
              </span>
            </div>

            {nextThreshold != null && nextProfileLabel && (
              <div className="text-[11px] text-[var(--color-f4)]">
                Faltam{" "}
                <span className="font-semibold text-[var(--color-f2)]">{nextThreshold} pts</span>
                {" "}para <span style={{ color: profileColor }}>{nextProfileLabel}</span>
              </div>
            )}
            {!nextThreshold && (
              <div className="text-[11px] text-[var(--color-green)]">
                Score máximo atingido ✓
              </div>
            )}
          </div>

          {/* Gauge */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <ScoreGauge score={total} color={profileColor} />
            <div className="text-[9px] text-[var(--color-f4)] uppercase tracking-[1.5px]">Score</div>
          </div>
        </div>
      </div>

      {/* ── Dimensões ── */}
      {dimensions.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {dimensions.map((dim) => (
            <DimensionCard
              key={dim.key}
              dim={dim}
              extra={dim.key === "reserve" ? <ReserveBalanceEditor current={reserveBalance} /> : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-12 text-[13px] text-[var(--color-f4)]">
          Registre transações para calcular o score.
        </div>
      )}

      {/* ── Dica ── */}
      {dimensions.length > 0 && (
        <div
          className="flex items-start gap-3 px-4 py-4 rounded-[12px] border"
          style={{
            background: "rgba(34,211,238,0.04)",
            borderColor: "rgba(34,211,238,0.15)",
          }}
        >
          <div className="w-6 h-6 rounded-full bg-[var(--color-cyan-dim)] border border-[var(--color-cyan-border)] flex items-center justify-center flex-shrink-0 mt-0.5">
            <IconBulb size={13} className="text-[var(--color-cyan)]" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[var(--color-cyan)]">
              Próximo passo{" "}
            </span>
            <span className="text-[12px] text-[var(--color-f2)]">{tip}</span>
          </div>
        </div>
      )}

    </div>
  );
}

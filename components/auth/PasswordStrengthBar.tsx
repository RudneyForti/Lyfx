"use client";

/**
 * CS-33 — Barra visual de força de senha
 *
 * Mostra 4 segmentos coloridos + lista das regras ainda não atendidas.
 * Aparece automaticamente quando `password` não está vazio.
 */

import { checkPasswordRules, getPasswordStrength, PasswordStrength } from "@/lib/password-strength";

/* ── Mapeamentos de nível ── */
const STRENGTH_LABELS: Record<PasswordStrength, string> = {
  weak:   "Fraca",
  fair:   "Razoável",
  good:   "Boa",
  strong: "Forte",
};

// Segmentos ativos (de 4) por nível
const STRENGTH_SEGMENTS: Record<PasswordStrength, number> = {
  weak:   1,
  fair:   2,
  good:   3,
  strong: 4,
};

// Cor do segmento ativo por nível
const STRENGTH_COLORS: Record<PasswordStrength, string> = {
  weak:   "var(--color-red)",
  fair:   "#F59E0B",                 // amber-400
  good:   "rgba(34,211,238,0.55)",   // cyan com opacidade
  strong: "var(--color-cyan)",
};

interface Props {
  password: string;
}

export function PasswordStrengthBar({ password }: Props) {
  if (!password) return null;

  const rules    = checkPasswordRules(password);
  const strength = getPasswordStrength(password);
  const color    = STRENGTH_COLORS[strength];
  const segments = STRENGTH_SEGMENTS[strength];
  const label    = STRENGTH_LABELS[strength];

  const ruleList = [
    { label: "8 caracteres",       ok: rules.hasLength  },
    { label: "Letra maiúscula",    ok: rules.hasUpper   },
    { label: "Letra minúscula",    ok: rules.hasLower   },
    { label: "Número",             ok: rules.hasNumber  },
    { label: "Caractere especial", ok: rules.hasSpecial },
  ];

  const failing = ruleList.filter((r) => !r.ok);

  return (
    <div className="flex flex-col gap-1.5 mt-0.5">

      {/* Barra de segmentos + label */}
      <div className="flex items-center gap-2">
        <div className="flex gap-[3px] flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[3px] flex-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i <= segments ? color : "var(--color-border2)",
              }}
            />
          ))}
        </div>
        <span
          className="text-[10px] font-semibold transition-colors duration-300"
          style={{ color, minWidth: 52, textAlign: "right" }}
        >
          {label}
        </span>
      </div>

      {/* Regras faltando — desaparecem conforme o usuário digita */}
      {failing.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {failing.map((r) => (
            <span
              key={r.label}
              className="flex items-center gap-1 text-[10px] text-[var(--color-f4)]"
            >
              {/* mini X */}
              <svg
                width="7" height="7" viewBox="0 0 12 12" fill="none"
                stroke="var(--color-red)" strokeWidth="2.5" strokeLinecap="round"
                className="flex-shrink-0"
              >
                <line x1="1" y1="1" x2="11" y2="11" />
                <line x1="11" y1="1" x2="1" y2="11" />
              </svg>
              {r.label}
            </span>
          ))}
        </div>
      )}

      {/* Tudo ok — badge verde */}
      {failing.length === 0 && (
        <div className="flex items-center gap-1 text-[10px] text-[var(--color-green)]">
          <svg
            width="8" height="8" viewBox="0 0 12 12" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="flex-shrink-0"
          >
            <polyline points="1,6 4.5,10 11,2" />
          </svg>
          Todos os requisitos atendidos
        </div>
      )}

    </div>
  );
}

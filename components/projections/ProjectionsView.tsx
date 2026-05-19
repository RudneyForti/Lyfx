"use client";

import { useState } from "react";
import { IconTrendingUp, IconTrendingDown, IconMinus, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import type { MonthProjection } from "@/app/actions/projections";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProjectionsView({ projections }: { projections: MonthProjection[] }) {
  const [selected, setSelected] = useState<number>(0);

  if (projections.length === 0) {
    return (
      <div style={{ padding: "28px 32px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Projeções</h1>
        <p style={{ fontSize: 13, color: "var(--color-f4)" }}>
          Cadastre transações recorrentes (mensais ou anuais) para ver as projeções dos próximos 12 meses.
        </p>
      </div>
    );
  }

  const maxIncome  = Math.max(...projections.map(p => p.incomeCommitted), 1);
  const maxExpense = Math.max(...projections.map(p => p.expenseCommitted), 1);
  const maxBar     = Math.max(maxIncome, maxExpense);

  const current = projections[selected];

  const totalFreeYear  = projections.reduce((s, p) => s + Math.max(0, p.free), 0);
  const avgFree        = projections.reduce((s, p) => s + p.free, 0) / projections.length;
  const negativeMonths = projections.filter(p => p.free < 0).length;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Projeções</h1>
        <p style={{ fontSize: 13, color: "var(--color-f3)", margin: "4px 0 0" }}>
          Visão dos compromissos recorrentes nos próximos 12 meses.
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 28 }}>
        {[
          {
            label: "Livre acumulado (12m)",
            value: fmt(totalFreeYear),
            sub: "soma dos meses positivos",
            color: totalFreeYear >= 0 ? "var(--color-green)" : "var(--color-red)",
          },
          {
            label: "Média mensal livre",
            value: fmt(avgFree),
            sub: "receitas − despesas comprometidas",
            color: avgFree >= 0 ? "var(--color-cyan)" : "var(--color-red)",
          },
          {
            label: "Meses no vermelho",
            value: `${negativeMonths}`,
            sub: negativeMonths === 0 ? "nenhum — ótimo sinal" : "despesas superam receitas",
            color: negativeMonths === 0 ? "var(--color-green)" : "var(--color-red)",
          },
        ].map(c => (
          <div key={c.label} style={{ background: "var(--color-bg2)", border: "1px solid var(--color-border)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--color-f4)", marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontStyle: "italic", fontFamily: "var(--font-display)", color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 10, color: "var(--color-f4)", marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Bar chart — macro 12 months */}
      <div style={{ background: "var(--color-bg2)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "var(--color-f4)", letterSpacing: 1, marginBottom: 16 }}>VISÃO MACRO — 12 MESES</div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          {[
            { color: "#22D3EE", label: "Receita comprometida" },
            { color: "#F87171", label: "Despesa comprometida" },
            { color: "#A3E635", label: "Livre" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-f3)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, flexShrink: 0 }} />
              {l.label}
            </div>
          ))}
        </div>

        {/* Bars */}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 140 }}>
          {projections.map((p, i) => {
            const incH  = Math.max(4, (p.incomeCommitted / maxBar) * 120);
            const expH  = Math.max(4, (p.expenseCommitted / maxBar) * 120);
            const freeH = p.free > 0 ? Math.max(4, (p.free / maxBar) * 120) : 0;
            const isSelected = i === selected;

            return (
              <div
                key={i}
                onClick={() => setSelected(i)}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
              >
                {/* Bar group */}
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 120 }}>
                  <div style={{ width: 8, height: incH, background: isSelected ? "#22D3EE" : "rgba(34,211,238,0.4)", borderRadius: "3px 3px 0 0", transition: "height 400ms ease" }} />
                  <div style={{ width: 8, height: expH, background: isSelected ? "#F87171" : "rgba(248,113,113,0.4)", borderRadius: "3px 3px 0 0", transition: "height 400ms ease" }} />
                  {freeH > 0 && (
                    <div style={{ width: 8, height: freeH, background: isSelected ? "#A3E635" : "rgba(163,230,53,0.4)", borderRadius: "3px 3px 0 0", transition: "height 400ms ease" }} />
                  )}
                </div>
                {/* Label */}
                <span style={{
                  fontSize: 10, color: isSelected ? "var(--color-f1)" : "var(--color-f4)",
                  fontWeight: isSelected ? 600 : 400,
                  borderBottom: isSelected ? "1px solid var(--color-cyan)" : "none",
                  paddingBottom: 1,
                }}>
                  {p.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly detail */}
      <div style={{ background: "var(--color-bg2)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              Detalhe — {current.label}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-f4)", marginTop: 2 }}>
              Clique em um mês no gráfico para detalhar
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
            background: current.free >= 0 ? "rgba(163,230,53,0.08)" : "rgba(248,113,113,0.08)",
            border: `1px solid ${current.free >= 0 ? "rgba(163,230,53,0.2)" : "rgba(248,113,113,0.2)"}`,
            color: current.free >= 0 ? "var(--color-green)" : "var(--color-red)",
          }}>
            {current.free >= 0
              ? <IconTrendingUp size={14} />
              : <IconTrendingDown size={14} />}
            {fmt(current.free)} livre
          </div>
        </div>

        {/* Totals */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div style={{ background: "var(--color-bg3)", borderRadius: 10, padding: 12, border: "1px solid rgba(34,211,238,0.15)" }}>
            <div style={{ fontSize: 10, color: "var(--color-f4)", marginBottom: 4 }}>RECEITAS COMPROMETIDAS</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-cyan)" }}>{fmt(current.incomeCommitted)}</div>
          </div>
          <div style={{ background: "var(--color-bg3)", borderRadius: 10, padding: 12, border: "1px solid rgba(248,113,113,0.15)" }}>
            <div style={{ fontSize: 10, color: "var(--color-f4)", marginBottom: 4 }}>DESPESAS COMPROMETIDAS</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-red)" }}>{fmt(current.expenseCommitted)}</div>
          </div>
        </div>

        {/* Item list */}
        {current.items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: "var(--color-f4)" }}>
            Nenhum compromisso recorrente neste mês.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Income items */}
            {current.items.filter(it => it.type === "income").length > 0 && (
              <>
                <div style={{ fontSize: 10, color: "var(--color-f4)", letterSpacing: 1, padding: "8px 0 6px" }}>ENTRADAS</div>
                {current.items.filter(it => it.type === "income").map((it, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--color-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <IconTrendingUp size={13} style={{ color: "var(--color-cyan)", flexShrink: 0 }} />
                      <span style={{ fontSize: 13 }}>{it.description}</span>
                      {it.isAnnual && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 999, background: "rgba(251,191,36,0.1)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.2)" }}>Anual</span>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-cyan)" }}>+{fmt(it.amount)}</span>
                  </div>
                ))}
              </>
            )}

            {/* Expense items */}
            {current.items.filter(it => it.type === "expense").length > 0 && (
              <>
                <div style={{ fontSize: 10, color: "var(--color-f4)", letterSpacing: 1, padding: "12px 0 6px" }}>SAÍDAS</div>
                {current.items.filter(it => it.type === "expense").map((it, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--color-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <IconTrendingDown size={13} style={{ color: "var(--color-red)", flexShrink: 0 }} />
                      <span style={{ fontSize: 13 }}>{it.description}</span>
                      {it.isAnnual && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 999, background: "rgba(251,191,36,0.1)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.2)" }}>Anual</span>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-red)" }}>-{fmt(it.amount)}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

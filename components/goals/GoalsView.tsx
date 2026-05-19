"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createGoal, deleteGoal, markPayment } from "@/app/actions/goals";
import {
  IconPlus, IconTarget, IconTrash, IconCheck, IconX,
  IconLoader2, IconAlertTriangle, IconCircleCheck, IconSparkles,
  IconTrendingDown,
} from "@tabler/icons-react";

const GOAL_COLORS = ["#22D3EE","#A3E635","#FBBF24","#A78BFA","#FB923C","#F472B6","#F87171","#60A5FA"];

type Payment = { id: string; dueDate: Date; amount: number; paid: boolean; paidAt: Date | null };
type Goal = {
  id: string; name: string; description: string | null;
  targetAmount: number; currentAmount: number; deadline: Date;
  color: string; monthlyAmount: number; status: string;
  payments: Payment[];
};

const PT_MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

type ActiveLiability = { id: string; name: string; interestRate: number; currentBalance: number };

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function feasibilityLabel(monthly: number, avg: number) {
  if (avg <= 0) return { ok: false, msg: "Sem histórico suficiente para avaliar." };
  const ratio = monthly / avg;
  if (ratio <= 0.3) return { ok: true,  msg: `Cabe folgado — ${(ratio * 100).toFixed(0)}% da sua sobra média.` };
  if (ratio <= 0.6) return { ok: true,  msg: `Factível — ${(ratio * 100).toFixed(0)}% da sua sobra média.` };
  if (ratio <= 1.0) return { ok: false, msg: `Apertado — exige ${(ratio * 100).toFixed(0)}% da sobra. Considere estender o prazo.` };
  return { ok: false, msg: `Inviável com sobra atual. Você precisaria de ${fmt(monthly - avg)}/mês a mais.` };
}

/* ── New goal form ── */
function NewGoalForm({ avgBalance, onClose }: { avgBalance: number; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTarget]     = useState("");
  const [deadline, setDeadline]       = useState("");
  const [color, setColor]             = useState(GOAL_COLORS[0]);
  const [error, setError]             = useState("");

  const months = deadline
    ? Math.max(1, (() => { const d = new Date(deadline); const n = new Date(); return (d.getFullYear() - n.getFullYear()) * 12 + d.getMonth() - n.getMonth(); })())
    : 0;
  const monthly = months > 0 && targetAmount ? Math.ceil(Number(targetAmount) / months) : 0;
  const feasibility = monthly > 0 ? feasibilityLabel(monthly, avgBalance) : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Nome obrigatório."); return; }
    if (!targetAmount || Number(targetAmount) <= 0) { setError("Valor inválido."); return; }
    if (!deadline) { setError("Prazo obrigatório."); return; }
    setError("");
    startTransition(async () => {
      await createGoal({ name, description, targetAmount: Number(targetAmount), deadline, color, icon: "target" });
      onClose();
    });
  }

  const inputStyle: React.CSSProperties = {
    height: 40, background: "var(--color-bg3)", border: "1px solid var(--color-border2)",
    borderRadius: 8, padding: "0 12px", fontSize: 13, color: "var(--color-f1)",
    outline: "none", width: "100%",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--color-bg2)", border: "1px solid var(--color-border2)", borderRadius: 18, padding: 28, width: 460, boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Nova meta</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--color-f3)", cursor: "pointer" }}>
            <IconX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, color: "var(--color-f3)" }}>Nome da meta</label>
            <input style={inputStyle} placeholder="Ex: Reserva de emergência" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, color: "var(--color-f3)" }}>Descrição (opcional)</label>
            <input style={inputStyle} placeholder="Contexto da meta" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, color: "var(--color-f3)" }}>Valor alvo (R$)</label>
              <input style={inputStyle} type="number" min="1" placeholder="10000" value={targetAmount} onChange={e => setTarget(e.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, color: "var(--color-f3)" }}>Prazo</label>
              <input style={inputStyle} type="month" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
          </div>

          {/* Color picker */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, color: "var(--color-f3)" }}>Cor</label>
            <div style={{ display: "flex", gap: 8 }}>
              {GOAL_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  style={{ width: 24, height: 24, borderRadius: "50%", background: c, border: color === c ? `2px solid white` : "2px solid transparent", cursor: "pointer", flexShrink: 0 }} />
              ))}
            </div>
          </div>

          {/* Preview */}
          {monthly > 0 && (
            <div style={{ background: "var(--color-bg3)", borderRadius: 10, padding: 14, border: `1px solid ${feasibility?.ok ? "rgba(163,230,53,0.2)" : "rgba(248,113,113,0.2)"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "var(--color-f3)" }}>Cobrança mensal gerada</span>
                <span style={{ fontSize: 15, fontWeight: 700, color }}>
                  {fmt(monthly)}<span style={{ fontSize: 11, color: "var(--color-f4)", fontWeight: 400 }}>/mês · {months} meses</span>
                </span>
              </div>
              {feasibility && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: feasibility.ok ? "var(--color-green)" : "var(--color-red)" }}>
                  {feasibility.ok ? <IconCircleCheck size={12} /> : <IconAlertTriangle size={12} />}
                  {feasibility.msg}
                </div>
              )}
            </div>
          )}

          {error && <div style={{ fontSize: 11, color: "var(--color-red)", display: "flex", alignItems: "center", gap: 5 }}><IconX size={11} />{error}</div>}

          <button type="submit" disabled={isPending}
            style={{ height: 40, background: color, color: "#083344", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4 }}>
            {isPending ? <IconLoader2 size={15} className="animate-spin" /> : <IconTarget size={15} />}
            Criar meta
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Goal card ── */
function GoalCard({ goal, avgBalance }: { goal: Goal; avgBalance: number }) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded]      = useState(false);

  const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  const upcoming = goal.payments.filter(p => !p.paid).slice(0, expanded ? 999 : 3);
  const paidCount = goal.payments.filter(p => p.paid).length;
  const feasibility = feasibilityLabel(goal.monthlyAmount, avgBalance);

  function togglePayment(p: Payment) {
    startTransition(() => markPayment(p.id, !p.paid));
  }

  function handleDelete() {
    if (!confirm(`Excluir a meta "${goal.name}"?`)) return;
    startTransition(() => deleteGoal(goal.id));
  }

  return (
    <div style={{ background: "var(--color-bg2)", border: `1px solid ${goal.color}33`, borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: goal.color, flexShrink: 0, display: "block" }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{goal.name}</div>
            {goal.description && <div style={{ fontSize: 11, color: "var(--color-f4)", marginTop: 1 }}>{goal.description}</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {goal.status === "completed" && (
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(163,230,53,0.1)", color: "var(--color-green)", border: "1px solid rgba(163,230,53,0.2)" }}>Concluída</span>
          )}
          <button onClick={handleDelete} disabled={isPending}
            style={{ background: "none", border: "none", color: "var(--color-f4)", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--color-red)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--color-f4)")}>
            <IconTrash size={14} />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
          <span style={{ color: "var(--color-f3)" }}>{fmt(goal.currentAmount)} de {fmt(goal.targetAmount)}</span>
          <span style={{ color: goal.color, fontWeight: 600 }}>{pct.toFixed(0)}%</span>
        </div>
        <div style={{ height: 6, background: "var(--color-bg5)", borderRadius: 999 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: goal.color, borderRadius: 999, transition: "width 600ms ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-f4)", marginTop: 5 }}>
          <span>{paidCount} de {goal.payments.length} cobranças pagas</span>
          <span>Prazo: {new Date(goal.deadline).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</span>
        </div>
      </div>

      {/* Feasibility */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: feasibility.ok ? "var(--color-green)" : "var(--color-red)" }}>
        {feasibility.ok ? <IconCircleCheck size={12} /> : <IconAlertTriangle size={12} />}
        {feasibility.msg}
      </div>

      {/* Upcoming payments */}
      {goal.status !== "completed" && (
        <div>
          <div style={{ fontSize: 10, color: "var(--color-f4)", letterSpacing: 1, marginBottom: 8 }}>COBRANÇAS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {upcoming.map(p => {
              const d = new Date(p.dueDate);
              const overdue = !p.paid && d < new Date();
              return (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 10px", borderRadius: 8,
                  background: p.paid ? "rgba(163,230,53,0.06)" : overdue ? "rgba(248,113,113,0.06)" : "var(--color-bg3)",
                  border: `1px solid ${p.paid ? "rgba(163,230,53,0.15)" : overdue ? "rgba(248,113,113,0.15)" : "var(--color-border)"}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => togglePayment(p)}
                      disabled={isPending}
                      style={{
                        width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${p.paid ? "var(--color-green)" : "var(--color-border2)"}`,
                        background: p.paid ? "rgba(163,230,53,0.15)" : "var(--color-bg4)",
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
                      }}>
                      {p.paid && <IconCheck size={11} style={{ color: "var(--color-green)" }} />}
                    </button>
                    <span style={{ fontSize: 12, color: p.paid ? "var(--color-f3)" : "var(--color-f1)", textDecoration: p.paid ? "line-through" : "none" }}>
                      {PT_MONTHS[d.getMonth()]} {d.getFullYear()}
                    </span>
                    {overdue && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 999, background: "rgba(248,113,113,0.1)", color: "var(--color-red)" }}>Em atraso</span>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: p.paid ? "var(--color-f3)" : goal.color }}>{fmt(p.amount)}</span>
                </div>
              );
            })}
          </div>
          {goal.payments.filter(p => !p.paid).length > 3 && (
            <button onClick={() => setExpanded(!expanded)}
              style={{ marginTop: 8, fontSize: 11, color: "var(--color-cyan)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {expanded ? "Ver menos" : `+${goal.payments.filter(p => !p.paid).length - 3} cobranças futuras`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main view ── */
export function GoalsView({
  goals,
  avgMonthlyBalance,
  activeLiabilities = [],
}: {
  goals: Goal[];
  avgMonthlyBalance: number;
  activeLiabilities?: ActiveLiability[];
}) {
  const [showForm, setShowForm] = useState(false);

  const active    = goals.filter(g => g.status !== "completed");
  const completed = goals.filter(g => g.status === "completed");
  const totalTarget  = active.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved   = active.reduce((s, g) => s + g.currentAmount, 0);
  const totalMonthly = active.reduce((s, g) => s + g.monthlyAmount, 0);

  // Contextual alert: high-interest debts (>= 5% a.m.) that should be prioritized
  const highInterestDebts = activeLiabilities.filter(l => l.interestRate >= 5);
  const totalDebtBalance  = activeLiabilities.reduce((s, l) => s + l.currentBalance, 0);

  return (
    <div className="p-8 max-w-[960px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
            Planejamento
          </div>
          <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] mb-2 leading-tight">
            Me<span className="text-[var(--color-cyan)]">tas</span>
          </h1>
          <p className="text-[var(--color-f3)] text-sm">
            Defina objetivos e acompanhe suas cobranças mensais.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-[13px] font-medium bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(34,211,238,0.25)] border-none cursor-pointer"
        >
          <IconPlus size={15} /> Nova meta
        </button>
      </div>

      {/* Contextual alert — high-interest liabilities exist */}
      {highInterestDebts.length > 0 && active.length > 0 && (
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "14px 16px",
          background: "rgba(248,113,113,0.06)",
          border: "1px solid rgba(248,113,113,0.25)",
          borderRadius: 10,
          marginBottom: 20,
        }}>
          <IconTrendingDown size={16} style={{ color: "var(--color-red)", flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-red)", marginBottom: 3 }}>
              Atenção: você tem {highInterestDebts.length === 1 ? "1 dívida" : `${highInterestDebts.length} dívidas`} com juros altos ({highInterestDebts.map(l => `${l.name} (${l.interestRate}% a.m.)`).join(", ")})
            </div>
            <div style={{ fontSize: 11, color: "var(--color-f3)", lineHeight: 1.5 }}>
              Com <strong style={{ color: "var(--color-red)" }}>{fmt(totalDebtBalance)}</strong> em dívidas caras,
              quitá-las antes pode render mais do que guardar para metas.
              Considere pausar novas metas até eliminar os juros mais altos.
            </div>
          </div>
          <Link
            href="/liabilities"
            style={{
              flexShrink: 0,
              fontSize: 11,
              padding: "5px 12px",
              borderRadius: 6,
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.25)",
              color: "var(--color-red)",
              textDecoration: "none",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Ver passivos
          </Link>
        </div>
      )}

      {/* Contextual info — small debts, no goals affected */}
      {activeLiabilities.length > 0 && highInterestDebts.length === 0 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          background: "rgba(34,211,238,0.04)",
          border: "1px solid var(--color-cyan-border)",
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 11,
          color: "var(--color-f3)",
        }}>
          <IconCircleCheck size={13} style={{ color: "var(--color-green)", flexShrink: 0 }} />
          Você tem {activeLiabilities.length === 1 ? "1 passivo ativo" : `${activeLiabilities.length} passivos ativos`} mas com juros baixos — suas metas estão bem priorizadas.
        </div>
      )}

      {/* Summary cards */}
      {active.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Total em metas", value: fmt(totalTarget), sub: `${active.length} ativa${active.length !== 1 ? "s" : ""}` },
            { label: "Já guardado",    value: fmt(totalSaved),  sub: `${totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}% do total` },
            { label: "Comprometido/mês", value: fmt(totalMonthly), sub: avgMonthlyBalance > 0 ? `${((totalMonthly / avgMonthlyBalance) * 100).toFixed(0)}% da sobra` : "sem histórico" },
          ].map(c => (
            <div key={c.label} style={{ background: "var(--color-bg2)", border: "1px solid var(--color-border)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "var(--color-f4)", marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, fontStyle: "italic", fontFamily: "var(--font-display)", color: "var(--color-cyan)" }}>{c.value}</div>
              <div style={{ fontSize: 10, color: "var(--color-f4)", marginTop: 2 }}>{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Avg balance info */}
      {avgMonthlyBalance > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(34,211,238,0.06)", border: "1px solid var(--color-cyan-border)", borderRadius: 8, fontSize: 12, color: "var(--color-f3)", marginBottom: 20 }}>
          <IconSparkles size={13} style={{ color: "var(--color-cyan)", flexShrink: 0 }} />
          Sobra média dos últimos 3 meses: <strong style={{ color: "var(--color-cyan)", marginLeft: 4 }}>{fmt(avgMonthlyBalance)}</strong>
        </div>
      )}

      {/* Empty state */}
      {goals.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-f4)" }}>
          <IconTarget size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div style={{ fontSize: 14 }}>Nenhuma meta criada ainda.</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Crie sua primeira meta e o sistema gera as cobranças automaticamente.</div>
        </div>
      )}

      {/* Active goals */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {active.map(g => <GoalCard key={g.id} goal={g} avgBalance={avgMonthlyBalance} />)}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 11, color: "var(--color-f4)", letterSpacing: 1, marginBottom: 12 }}>CONCLUÍDAS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {completed.map(g => <GoalCard key={g.id} goal={g} avgBalance={avgMonthlyBalance} />)}
          </div>
        </div>
      )}

      {showForm && <NewGoalForm avgBalance={avgMonthlyBalance} onClose={() => setShowForm(false)} />}
    </div>
  );
}

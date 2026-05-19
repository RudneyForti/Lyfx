"use client";

import { useState, useTransition } from "react";
import {
  createLiability,
  updateLiability,
  deleteLiability,
} from "@/app/actions/liabilities";
import type { Liability, LiabilityType } from "@/app/actions/liabilities";
import { monthsToPayoff } from "@/lib/liabilities";
import {
  IconPlus,
  IconX,
  IconTrash,
  IconEdit,
  IconLoader2,
  IconAlertTriangle,
  IconCircleCheck,
  IconCalculator,
  IconTrendingDown,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pct(v: number) {
  return v.toFixed(1) + "%";
}

const TYPE_LABELS: Record<LiabilityType, string> = {
  cheque_especial: "Cheque especial",
  rotativo: "Crédito rotativo",
  emprestimo: "Empréstimo",
  financiamento: "Financiamento",
  outro: "Outro",
};

const TYPE_OPTIONS: LiabilityType[] = [
  "cheque_especial",
  "rotativo",
  "emprestimo",
  "financiamento",
  "outro",
];

const inputStyle: React.CSSProperties = {
  height: 40,
  background: "var(--color-bg3)",
  border: "1px solid var(--color-border2)",
  borderRadius: 8,
  padding: "0 12px",
  fontSize: 13,
  color: "var(--color-f1)",
  outline: "none",
  width: "100%",
};

/* ── Form (create / edit) ── */
function LiabilityForm({
  initial,
  onClose,
}: {
  initial?: Liability;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<LiabilityType>(
    (initial?.type as LiabilityType) ?? "emprestimo"
  );
  const [balance, setBalance] = useState(
    initial ? String(initial.currentBalance) : ""
  );
  const [rate, setRate] = useState(
    initial ? String(initial.interestRate) : ""
  );
  const [minPay, setMinPay] = useState(
    initial ? String(initial.minimumPayment) : ""
  );
  const [creditor, setCreditor] = useState(initial?.creditor ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  const isEdit = !!initial;

  // preview payoff
  const previewMonths =
    balance && rate && minPay
      ? monthsToPayoff(Number(balance), Number(rate), Number(minPay))
      : undefined;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Nome obrigatório."); return; }
    if (!balance || Number(balance) <= 0) { setError("Saldo inválido."); return; }
    if (!rate || Number(rate) < 0) { setError("Taxa inválida."); return; }
    setError("");
    startTransition(async () => {
      if (isEdit) {
        await updateLiability(initial.id, {
          name,
          type,
          currentBalance: Number(balance),
          interestRate: Number(rate),
          minimumPayment: Number(minPay) || 0,
          creditor: creditor || undefined,
          notes: notes || undefined,
        });
      } else {
        await createLiability({
          name,
          type,
          currentBalance: Number(balance),
          interestRate: Number(rate),
          minimumPayment: Number(minPay) || 0,
          creditor: creditor || undefined,
          notes: notes || undefined,
        });
      }
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--color-bg2)",
          border: "1px solid var(--color-border2)",
          borderRadius: 18,
          padding: 28,
          width: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            {isEdit ? "Editar passivo" : "Novo passivo"}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-f3)",
              cursor: "pointer",
            }}
          >
            <IconX size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          {/* Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, color: "var(--color-f3)" }}>Nome</label>
            <input
              style={inputStyle}
              placeholder="Ex: Cartão Nubank"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Type */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, color: "var(--color-f3)" }}>Tipo</label>
            <select
              style={{
                ...inputStyle,
                appearance: "none",
                cursor: "pointer",
              }}
              value={type}
              onChange={(e) => setType(e.target.value as LiabilityType)}
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {/* Balance + Rate */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, color: "var(--color-f3)" }}>
                Saldo devedor (R$)
              </label>
              <input
                style={inputStyle}
                type="number"
                min="0.01"
                step="0.01"
                placeholder="5000"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, color: "var(--color-f3)" }}>
                Taxa de juros (% a.m.)
              </label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="0.01"
                placeholder="12.5"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
          </div>

          {/* Min payment + Creditor */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, color: "var(--color-f3)" }}>
                Pagamento mínimo (R$)
              </label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                step="0.01"
                placeholder="200"
                value={minPay}
                onChange={(e) => setMinPay(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, color: "var(--color-f3)" }}>
                Credor (opcional)
              </label>
              <input
                style={inputStyle}
                placeholder="Banco X"
                value={creditor}
                onChange={(e) => setCreditor(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, color: "var(--color-f3)" }}>
              Observações (opcional)
            </label>
            <input
              style={inputStyle}
              placeholder="Contexto adicional"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Payoff preview */}
          {previewMonths !== undefined && balance && rate && minPay && (
            <div
              style={{
                background: "var(--color-bg3)",
                borderRadius: 10,
                padding: 14,
                border:
                  previewMonths === null
                    ? "1px solid rgba(248,113,113,0.25)"
                    : "1px solid rgba(34,211,238,0.15)",
              }}
            >
              <div
                style={{ fontSize: 11, color: "var(--color-f3)", marginBottom: 4 }}
              >
                Previsão com pagamento mínimo
              </div>
              {previewMonths === null ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "var(--color-red)",
                  }}
                >
                  <IconAlertTriangle size={13} />
                  Pagamento não cobre os juros — a dívida nunca será quitada!
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: previewMonths > 24 ? "var(--color-red)" : "var(--color-cyan)",
                  }}
                >
                  Quitação em {previewMonths} {previewMonths === 1 ? "mês" : "meses"}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 400,
                      color: "var(--color-f4)",
                      marginLeft: 6,
                    }}
                  >
                    (
                    {Math.floor(previewMonths / 12) > 0
                      ? `${Math.floor(previewMonths / 12)}a `
                      : ""}
                    {previewMonths % 12 > 0
                      ? `${previewMonths % 12}m`
                      : ""}
                    )
                  </span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div
              style={{
                fontSize: 11,
                color: "var(--color-red)",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <IconX size={11} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            style={{
              height: 40,
              background: "var(--color-cyan)",
              color: "#083344",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              marginTop: 4,
            }}
          >
            {isPending ? (
              <IconLoader2 size={15} className="animate-spin" />
            ) : (
              <IconTrendingDown size={15} />
            )}
            {isEdit ? "Salvar alterações" : "Registrar passivo"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Liability card ── */
function LiabilityCard({ liability }: { liability: Liability }) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  const isActive = liability.status === "active";
  const monthlyInterest = liability.currentBalance * (liability.interestRate / 100);

  function handleDelete() {
    if (!confirm(`Excluir "${liability.name}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(() => deleteLiability(liability.id));
  }

  function handleMarkPaid() {
    if (!confirm(`Marcar "${liability.name}" como quitada?`)) return;
    setMarkingPaid(false);
    startTransition(() =>
      updateLiability(liability.id, { status: "paid_off" })
    );
  }

  const payoff = monthsToPayoff(
    liability.currentBalance,
    liability.interestRate,
    liability.minimumPayment
  );

  return (
    <>
      <div
        style={{
          background: "var(--color-bg2)",
          border: `1px solid ${isActive ? "rgba(248,113,113,0.2)" : "rgba(163,230,53,0.15)"}`,
          borderRadius: 14,
          padding: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 3,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--color-f1)",
                }}
              >
                {liability.name}
              </span>
              {!isActive && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "rgba(163,230,53,0.1)",
                    color: "var(--color-green)",
                    border: "1px solid rgba(163,230,53,0.2)",
                  }}
                >
                  Quitada
                </span>
              )}
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}
            >
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "var(--color-bg4)",
                  color: "var(--color-f3)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {TYPE_LABELS[liability.type as LiabilityType] ?? liability.type}
              </span>
              {liability.creditor && (
                <span style={{ color: "var(--color-f4)" }}>
                  {liability.creditor}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isActive && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  disabled={isPending}
                  title="Editar"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-f4)",
                    cursor: "pointer",
                    padding: 4,
                    borderRadius: 6,
                    display: "flex",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--color-cyan)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--color-f4)")
                  }
                >
                  <IconEdit size={14} />
                </button>
                <button
                  onClick={() => setMarkingPaid(true)}
                  disabled={isPending}
                  title="Marcar como quitada"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-f4)",
                    cursor: "pointer",
                    padding: 4,
                    borderRadius: 6,
                    display: "flex",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--color-green)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--color-f4)")
                  }
                >
                  <IconCircleCheck size={14} />
                </button>
              </>
            )}
            <button
              onClick={handleDelete}
              disabled={isPending}
              title="Excluir"
              style={{
                background: "none",
                border: "none",
                color: "var(--color-f4)",
                cursor: "pointer",
                padding: 4,
                borderRadius: 6,
                display: "flex",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--color-red)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--color-f4)")
              }
            >
              <IconTrash size={14} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 10, color: "var(--color-f4)", marginBottom: 2 }}>
              Saldo devedor
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                fontStyle: "italic",
                fontFamily: "var(--font-display)",
                color: isActive ? "var(--color-red)" : "var(--color-f3)",
              }}
            >
              {fmt(liability.currentBalance)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--color-f4)", marginBottom: 2 }}>
              Juros/mês
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: isActive ? "var(--color-red)" : "var(--color-f3)",
              }}
            >
              {fmt(monthlyInterest)}
              <span
                style={{ fontSize: 10, color: "var(--color-f4)", marginLeft: 4 }}
              >
                {pct(liability.interestRate)} a.m.
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--color-f4)", marginBottom: 2 }}>
              Pagamento mínimo
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-f2)" }}>
              {fmt(liability.minimumPayment)}
            </div>
          </div>
        </div>

        {/* Payoff estimate */}
        {isActive && liability.minimumPayment > 0 && (
          <div
            style={{
              marginTop: 10,
              padding: "8px 12px",
              borderRadius: 8,
              background:
                payoff === null
                  ? "rgba(248,113,113,0.06)"
                  : "var(--color-bg3)",
              border:
                payoff === null
                  ? "1px solid rgba(248,113,113,0.2)"
                  : "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
            }}
          >
            {payoff === null ? (
              <>
                <IconAlertTriangle
                  size={12}
                  style={{ color: "var(--color-red)", flexShrink: 0 }}
                />
                <span style={{ color: "var(--color-red)" }}>
                  Pagamento mínimo não cobre os juros — a dívida nunca será quitada
                  assim.
                </span>
              </>
            ) : (
              <>
                <IconCalculator
                  size={12}
                  style={{ color: "var(--color-f4)", flexShrink: 0 }}
                />
                <span style={{ color: "var(--color-f3)" }}>
                  Quitação estimada com mínimo:
                  <strong
                    style={{
                      color:
                        payoff > 36
                          ? "var(--color-red)"
                          : payoff > 12
                          ? "var(--color-amber)"
                          : "var(--color-green)",
                      marginLeft: 4,
                    }}
                  >
                    {payoff} {payoff === 1 ? "mês" : "meses"}
                  </strong>
                </span>
              </>
            )}
          </div>
        )}

        {liability.notes && (
          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              color: "var(--color-f4)",
              fontStyle: "italic",
            }}
          >
            {liability.notes}
          </div>
        )}

        {/* Mark paid confirmation */}
        {markingPaid && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(163,230,53,0.06)",
              border: "1px solid rgba(163,230,53,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12,
            }}
          >
            <span style={{ flex: 1, color: "var(--color-f2)" }}>
              Confirmar quitação de "{liability.name}"?
            </span>
            <button
              onClick={handleMarkPaid}
              disabled={isPending}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                background: "rgba(163,230,53,0.15)",
                border: "1px solid rgba(163,230,53,0.3)",
                color: "var(--color-green)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Confirmar
            </button>
            <button
              onClick={() => setMarkingPaid(false)}
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                background: "none",
                border: "1px solid var(--color-border)",
                color: "var(--color-f4)",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>

      {editing && (
        <LiabilityForm initial={liability} onClose={() => setEditing(false)} />
      )}
    </>
  );
}

/* ── Modo Recuperação — avalanche payoff plan + extra payment calculator ── */
function ModoRecuperacao({ liabilities }: { liabilities: Liability[] }) {
  const [extra, setExtra] = useState("");
  const [expanded, setExpanded] = useState(true);

  const active = liabilities.filter((l) => l.status === "active");
  if (active.length === 0) return null;

  // Sorted by rate descending (avalanche)
  const sorted = [...active].sort((a, b) => b.interestRate - a.interestRate);
  const extraAmt = Number(extra) || 0;

  const totalBalance = active.reduce((s, l) => s + l.currentBalance, 0);
  const totalMinimum = active.reduce((s, l) => s + l.minimumPayment, 0);
  const totalInterest = active.reduce(
    (s, l) => s + l.currentBalance * (l.interestRate / 100),
    0
  );

  // For each debt in avalanche order: assign extra to first, rest get only minimum
  function getAvalancheMonths(
    debts: Liability[],
    extraPayment: number
  ): (number | null)[] {
    return debts.map((d, i) =>
      monthsToPayoff(d.currentBalance, d.interestRate, d.minimumPayment + (i === 0 ? extraPayment : 0))
    );
  }

  const avalancheMonths = getAvalancheMonths(sorted, extraAmt);
  const baseMonths = getAvalancheMonths(sorted, 0);

  return (
    <div
      style={{
        background: "var(--color-bg2)",
        border: "1px solid rgba(248,113,113,0.2)",
        borderRadius: 16,
        overflow: "hidden",
        marginTop: 32,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          borderBottom: expanded
            ? "1px solid rgba(248,113,113,0.15)"
            : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconTrendingDown size={16} style={{ color: "var(--color-red)" }} />
          </div>
          <div style={{ textAlign: "left" }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--color-f1)",
              }}
            >
              Modo Recuperação
            </div>
            <div style={{ fontSize: 11, color: "var(--color-f4)" }}>
              Plano de quitação no método avalanche (maior juro primeiro)
            </div>
          </div>
        </div>
        {expanded ? (
          <IconChevronUp size={16} style={{ color: "var(--color-f4)", flexShrink: 0 }} />
        ) : (
          <IconChevronDown size={16} style={{ color: "var(--color-f4)", flexShrink: 0 }} />
        )}
      </button>

      {expanded && (
        <div style={{ padding: "20px" }}>
          {/* Summary stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              marginBottom: 20,
            }}
          >
            {[
              {
                label: "Total em dívidas",
                value: fmt(totalBalance),
                color: "var(--color-red)",
              },
              {
                label: "Juros queimados/mês",
                value: fmt(totalInterest),
                color: "var(--color-red)",
              },
              {
                label: "Pagamento mínimo total",
                value: fmt(totalMinimum),
                color: "var(--color-f2)",
              },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  background: "var(--color-bg3)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--color-f4)",
                    marginBottom: 4,
                  }}
                >
                  {c.label}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    fontStyle: "italic",
                    fontFamily: "var(--font-display)",
                    color: c.color,
                  }}
                >
                  {c.value}
                </div>
              </div>
            ))}
          </div>

          {/* Extra payment calculator */}
          <div
            style={{
              background: "var(--color-bg3)",
              border: "1px solid var(--color-border2)",
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <IconCalculator
                size={14}
                style={{ color: "var(--color-cyan)", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-f2)",
                }}
              >
                Calculadora — pagamento extra
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "var(--color-f3)", flexShrink: 0 }}>
                Pagamento extra mensal:
              </span>
              <input
                style={{
                  ...inputStyle,
                  height: 36,
                  width: 160,
                  flex: "0 0 auto",
                }}
                type="number"
                min="0"
                step="50"
                placeholder="0"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
              />
              {extraAmt > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--color-f4)",
                    fontStyle: "italic",
                  }}
                >
                  Será aplicado à dívida de maior juro primeiro
                </span>
              )}
            </div>
          </div>

          {/* Avalanche plan */}
          <div
            style={{
              fontSize: 10,
              color: "var(--color-f4)",
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            ORDEM AVALANCHE
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sorted.map((l, i) => {
              const months = avalancheMonths[i];
              const base = baseMonths[i];
              const payment =
                l.minimumPayment + (i === 0 ? extraAmt : 0);
              const saved =
                base !== null && months !== null && extraAmt > 0
                  ? base - months
                  : null;

              return (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    background: "var(--color-bg3)",
                    border:
                      i === 0
                        ? "1px solid rgba(248,113,113,0.25)"
                        : "1px solid var(--color-border)",
                    borderRadius: 10,
                  }}
                >
                  {/* Priority badge */}
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background:
                        i === 0
                          ? "rgba(248,113,113,0.15)"
                          : "var(--color-bg4)",
                      border:
                        i === 0
                          ? "1px solid rgba(248,113,113,0.3)"
                          : "1px solid var(--color-border2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 11,
                      fontWeight: 700,
                      color:
                        i === 0
                          ? "var(--color-red)"
                          : "var(--color-f4)",
                    }}
                  >
                    {i + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--color-f1)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {l.name}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--color-red)",
                          flexShrink: 0,
                        }}
                      >
                        {fmt(l.currentBalance)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginTop: 3,
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontSize: 11, color: "var(--color-f4)" }}>
                        {pct(l.interestRate)} a.m.
                      </span>
                      <span style={{ fontSize: 11, color: "var(--color-f3)" }}>
                        Pagar: {fmt(payment)}/mês
                      </span>
                      {months === null ? (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--color-red)",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <IconAlertTriangle size={11} />
                          Nunca quita
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            color:
                              months > 36
                                ? "var(--color-red)"
                                : months > 12
                                ? "var(--color-amber)"
                                : "var(--color-green)",
                            fontWeight: 600,
                          }}
                        >
                          Quita em {months} {months === 1 ? "mês" : "meses"}
                          {saved !== null && saved > 0 && (
                            <span
                              style={{
                                fontWeight: 400,
                                color: "var(--color-green)",
                                marginLeft: 4,
                              }}
                            >
                              (−{saved} {saved === 1 ? "mês" : "meses"} com extra)
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tip */}
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(34,211,238,0.05)",
              border: "1px solid var(--color-cyan-border)",
              fontSize: 11,
              color: "var(--color-f3)",
              lineHeight: 1.5,
            }}
          >
            💡 <strong style={{ color: "var(--color-cyan)" }}>Método avalanche:</strong>{" "}
            concentre o pagamento extra na dívida de maior juro enquanto paga o mínimo
            nas demais. Ao quitar uma dívida, redirecione o valor para a próxima —
            isso minimiza o custo total de juros.
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main view ── */
export function LiabilitiesView({ liabilities }: { liabilities: Liability[] }) {
  const [showForm, setShowForm] = useState(false);

  const active = liabilities.filter((l) => l.status === "active");
  const paidOff = liabilities.filter((l) => l.status !== "active");

  const totalBalance = active.reduce((s, l) => s + l.currentBalance, 0);
  const totalInterest = active.reduce(
    (s, l) => s + l.currentBalance * (l.interestRate / 100),
    0
  );
  const totalMinimum = active.reduce((s, l) => s + l.minimumPayment, 0);

  return (
    <div className="p-8 max-w-[960px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
            Planejamento
          </div>
          <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] mb-2 leading-tight">
            Pas<span className="text-[var(--color-red)]">sivos</span>
          </h1>
          <p className="text-[var(--color-f3)] text-sm">
            Gerencie dívidas e veja seu plano de quitação.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-[13px] font-medium bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(34,211,238,0.25)] border-none cursor-pointer"
        >
          <IconPlus size={15} /> Registrar dívida
        </button>
      </div>

      {/* Summary cards */}
      {active.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {[
            {
              label: "Total em dívidas",
              value: fmt(totalBalance),
              sub: `${active.length} ativa${active.length !== 1 ? "s" : ""}`,
              color: "var(--color-red)",
            },
            {
              label: "Juros queimados/mês",
              value: fmt(totalInterest),
              sub: "custo mensal com juros",
              color: "var(--color-red)",
            },
            {
              label: "Mínimos/mês",
              value: fmt(totalMinimum),
              sub: "comprometido em mínimos",
              color: "var(--color-f2)",
            },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                background: "var(--color-bg2)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-f4)",
                  marginBottom: 4,
                }}
              >
                {c.label}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  fontStyle: "italic",
                  fontFamily: "var(--font-display)",
                  color: c.color,
                }}
              >
                {c.value}
              </div>
              <div
                style={{ fontSize: 10, color: "var(--color-f4)", marginTop: 2 }}
              >
                {c.sub}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {liabilities.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 0",
            color: "var(--color-f4)",
          }}
        >
          <IconTrendingDown
            size={40}
            style={{ opacity: 0.3, marginBottom: 12 }}
          />
          <div style={{ fontSize: 14 }}>Nenhum passivo registrado.</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Registre dívidas para acompanhar seu plano de quitação.
          </div>
        </div>
      )}

      {/* Active liabilities */}
      {active.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {active.map((l) => (
            <LiabilityCard key={l.id} liability={l} />
          ))}
        </div>
      )}

      {/* Modo Recuperação */}
      <ModoRecuperacao liabilities={liabilities} />

      {/* Paid off */}
      {paidOff.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-f4)",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            QUITADAS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {paidOff.map((l) => (
              <LiabilityCard key={l.id} liability={l} />
            ))}
          </div>
        </div>
      )}

      {showForm && <LiabilityForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

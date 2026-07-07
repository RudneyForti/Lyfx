"use client";

import { useState, useTransition, useRef, useEffect, useMemo } from "react";
import { saveKanbanBoard } from "@/app/studio/actions";
import type { KanbanBoard, KanbanCard, KanbanColumn } from "@/app/studio/actions";
// Pure helpers come straight from lib (a "use server" barrel only re-exports
// async functions and types, so client-side helpers can't route through it).
import { withActivity, groupByRelease, daysUntil } from "@/lib/kanban";
import {
  IconX, IconPlus, IconGripVertical, IconCheck, IconBrandGit,
  IconCalendar, IconTag, IconTrash, IconLoader2,
  IconSortAscending, IconSortDescending, IconChevronDown, IconChevronRight,
  IconMessageCircle, IconListCheck, IconClock, IconSend, IconArrowRight,
} from "@tabler/icons-react";

/* ── helpers ── */
function relDate(iso: string | null) {
  if (!iso) return null;
  const d    = new Date(iso);
  const now  = Date.now();
  const diff = now - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30)  return `há ${days} dias`;
  if (days < 365) return `há ${Math.floor(days / 30)} meses`;
  return `há ${Math.floor(days / 365)} anos`;
}

function shortDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function stampDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Due-date chip semantics: red = overdue/today, amber = within 3 days. */
function dueChip(dueAt: string): { text: string; color: string } {
  const d = daysUntil(dueAt);
  if (d < 0)  return { text: `atrasada ${Math.abs(d)}d`, color: "#f87171" };
  if (d === 0) return { text: "vence hoje", color: "#f87171" };
  if (d <= 3) return { text: `vence em ${d}d`, color: "#f59e0b" };
  return { text: shortDate(dueAt), color: "var(--color-f4)" };
}

const COLUMN_STYLES: Record<string, { accent: string; badge: string; bg: string }> = {
  "backlog":     { accent: "#64748b", badge: "rgba(100,116,139,0.15)", bg: "rgba(100,116,139,0.06)" },
  "in-progress": { accent: "#22d3ee", badge: "rgba(34,211,238,0.15)",  bg: "rgba(34,211,238,0.05)"  },
  "blocked":     { accent: "#f59e0b", badge: "rgba(245,158,11,0.15)",  bg: "rgba(245,158,11,0.05)"  },
  "done":        { accent: "#4ade80", badge: "rgba(74,222,128,0.15)",  bg: "rgba(74,222,128,0.04)"  },
};

const LABEL_COLORS: Record<string, string> = {
  "segurança":  "#f87171",
  "crítico":    "#ef4444",
  "feature":    "#22d3ee",
  "bug":        "#fb923c",
  "ux":         "#a78bfa",
  "design":     "#e879f9",
  "infra":      "#60a5fa",
  "docker":     "#60a5fa",
  "refactor":   "#94a3b8",
  "qualidade":  "#94a3b8",
  "typescript": "#3b82f6",
  "banco":      "#f59e0b",
  "studio":     "#22d3ee",
  "produto":    "#34d399",
  "oauth":      "#f472b6",
  "email":      "#a3e635",
  "pdf":        "#fb7185",
  "transações": "#fbbf24",
  "metas":      "#86efac",
  "alertas":    "#fcd34d",
  "relatórios": "#67e8f9",
  "tags":       "#c4b5fd",
  "layout":     "#a8a29e",
  "processo":   "#d1d5db",
  "agentes":    "#d1d5db",
  "notificações": "#818cf8",
  "marca":      "#f9a8d4",
  "reembolso":  "#6ee7b7",
  "deploy":     "#93c5fd",
  "autenticação": "#f87171",
};

function labelColor(l: string) {
  return LABEL_COLORS[l] ?? "#94a3b8";
}

/* ── Label badge ── */
function LabelBadge({ label }: { label: string }) {
  const col = labelColor(label);
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, letterSpacing: "0.02em",
      padding: "2px 6px", borderRadius: 4,
      background: col + "22", color: col, border: `1px solid ${col}44`,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

/* ── Card component ── */
function KanbanCardItem({
  card, onDragStart, onDragEnd, onClick, colAccent,
}: {
  card: KanbanCard;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onClick: () => void;
  colAccent: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "var(--color-bg3, #1e293b)" : "var(--color-bg2)",
        border: `1px solid ${hov ? colAccent + "66" : "var(--color-border)"}`,
        borderRadius: 10,
        padding: "10px 12px",
        cursor: "pointer",
        transition: "all 150ms",
        userSelect: "none",
        position: "relative",
      }}
    >
      {/* CS number + grip */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
          background: colAccent + "22", color: colAccent,
          border: `1px solid ${colAccent}44`,
          padding: "2px 7px", borderRadius: 4,
        }}>
          {card.csNumber}
        </span>
        <IconGripVertical size={13} style={{ color: "var(--color-f4)", opacity: hov ? 1 : 0.4 }} />
      </div>

      {/* Title */}
      <p style={{
        margin: 0, fontSize: 13, fontWeight: 500,
        color: "var(--color-f1)", lineHeight: 1.4,
        marginBottom: card.labels.length ? 8 : 0,
      }}>
        {card.title}
      </p>

      {/* Labels */}
      {card.labels.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {card.labels.slice(0, 4).map(l => <LabelBadge key={l} label={l} />)}
          {card.labels.length > 4 && (
            <span style={{ fontSize: 10, color: "var(--color-f4)" }}>+{card.labels.length - 4}</span>
          )}
        </div>
      )}

      {/* Footer: version + dates + CS-59 chips (checklist, due, comments) */}
      {(() => {
        const checkTotal = card.checklist.length;
        const checkDone = card.checklist.filter(i => i.done).length;
        const commentCount = card.comments.filter(c => c.type === "comment").length;
        const showDue = card.dueAt && card.columnId !== "done";
        const due = showDue ? dueChip(card.dueAt!) : null;
        const hasFooter = card.version || card.commitHash || card.completedAt || checkTotal > 0 || showDue || commentCount > 0;
        if (!hasFooter) return null;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {card.version && (
              <span style={{ fontSize: 10, color: "var(--color-f4)", display: "flex", alignItems: "center", gap: 3 }}>
                <IconCheck size={10} />
                v{card.version}
              </span>
            )}
            {card.commitHash && (
              <span style={{ fontSize: 10, color: "var(--color-f4)", display: "flex", alignItems: "center", gap: 3, fontFamily: "monospace" }}>
                <IconBrandGit size={10} />
                {card.commitHash.slice(0, 7)}
              </span>
            )}
            {card.completedAt && (
              <span style={{ fontSize: 10, color: "var(--color-f4)", display: "flex", alignItems: "center", gap: 3 }}>
                <IconCalendar size={10} />
                {relDate(card.completedAt)}
              </span>
            )}
            {checkTotal > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 3,
                color: checkDone === checkTotal ? "#4ade80" : "var(--color-f4)",
                background: checkDone === checkTotal ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.05)",
                padding: "1px 6px", borderRadius: 4,
              }}>
                <IconListCheck size={10} />
                {checkDone}/{checkTotal}
              </span>
            )}
            {due && (
              <span style={{
                fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 3,
                color: due.color,
                background: due.color === "var(--color-f4)" ? "rgba(255,255,255,0.05)" : due.color + "1f",
                padding: "1px 6px", borderRadius: 4,
              }}>
                <IconClock size={10} />
                {due.text}
              </span>
            )}
            {commentCount > 0 && (
              <span style={{ fontSize: 10, color: "var(--color-f4)", display: "flex", alignItems: "center", gap: 3 }}>
                <IconMessageCircle size={10} />
                {commentCount}
              </span>
            )}
          </div>
        );
      })()}
    </div>
  );
}

/* ── Card Detail Modal ── */
const ALL_LABELS = [
  "segurança","crítico","feature","bug","ux","design","infra","docker",
  "refactor","qualidade","typescript","banco","studio","produto","oauth",
  "email","pdf","transações","metas","alertas","relatórios","tags","layout",
  "processo","agentes","notificações","marca","reembolso","deploy","autenticação",
];

function CardModal({
  card, columns, onClose, onSave, onDelete,
}: {
  card: KanbanCard;
  columns: KanbanColumn[];
  onClose: () => void;
  /** Returns the card as persisted — the parent may enrich it (e.g. the
   *  column-move activity entry), and the draft must sync to that result. */
  onSave: (updated: KanbanCard) => KanbanCard;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState<KanbanCard>({ ...card });
  const [labelInput, setLabelInput] = useState("");
  const [checkInput, setCheckInput] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [isPending, start] = useTransition();
  const dirty = JSON.stringify(draft) !== JSON.stringify(card);

  function update<K extends keyof KanbanCard>(k: K, v: KanbanCard[K]) {
    setDraft(d => ({ ...d, [k]: v }));
  }

  /* ── checklist ── */
  function addCheckItem() {
    const text = checkInput.trim();
    if (!text) return;
    update("checklist", [
      ...draft.checklist,
      { id: `chk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, done: false },
    ]);
    setCheckInput("");
  }
  function toggleCheckItem(id: string) {
    update("checklist", draft.checklist.map(i => i.id === id ? { ...i, done: !i.done } : i));
  }
  function removeCheckItem(id: string) {
    update("checklist", draft.checklist.filter(i => i.id !== id));
  }

  /* ── comments: persist immediately (Trello behavior), no Save needed ── */
  function addComment() {
    const text = commentInput.trim();
    if (!text) return;
    const next: KanbanCard = {
      ...draft,
      comments: [
        ...draft.comments,
        { id: `com-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, createdAt: new Date().toISOString(), type: "comment" as const },
      ],
    };
    setCommentInput("");
    start(() => setDraft(onSave(next)));
  }

  function addLabel(l: string) {
    const lc = l.trim().toLowerCase();
    if (!lc || draft.labels.includes(lc)) return;
    update("labels", [...draft.labels, lc]);
    setLabelInput("");
  }

  function removeLabel(l: string) {
    update("labels", draft.labels.filter(x => x !== l));
  }

  function handleSave() {
    start(() => setDraft(onSave(draft)));
  }

  function handleDelete() {
    if (!confirm(`Excluir o card "${draft.csNumber}"? Esta ação não pode ser desfeita.`)) return;
    onDelete(draft.id);
  }

  // keyboard: Escape to close, Ctrl+S to save
  useEffect(() => {
    function kh(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (dirty) handleSave(); }
    }
    window.addEventListener("keydown", kh);
    return () => window.removeEventListener("keydown", kh);
  });

  const col = columns.find(c => c.id === draft.columnId);
  const style = COLUMN_STYLES[draft.columnId] ?? COLUMN_STYLES["backlog"];

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "40px 16px", overflowY: "auto",
      }}
    >
      <div style={{
        width: "100%", maxWidth: 700,
        background: "var(--color-bg2)",
        border: `1px solid ${style.accent}44`,
        borderRadius: 16, overflow: "hidden",
        boxShadow: `0 0 0 1px ${style.accent}22, 0 32px 64px rgba(0,0,0,0.5)`,
      }}>
        {/* Modal header */}
        <div style={{
          background: style.bg, borderBottom: `1px solid ${style.accent}33`,
          padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            {/* CS number badge + column */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, letterSpacing: "0.05em",
                background: style.accent + "22", color: style.accent,
                border: `1px solid ${style.accent}44`, padding: "3px 9px", borderRadius: 5,
              }}>
                {draft.csNumber}
              </span>
              <span style={{ fontSize: 11, color: "var(--color-f4)" }}>
                em <strong style={{ color: col?.title ? style.accent : "var(--color-f3)" }}>{col?.title ?? draft.columnId}</strong>
              </span>
              {draft.completedAt && (
                <span style={{ fontSize: 11, color: "var(--color-f4)", marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                  <IconCalendar size={11} />
                  Concluída {relDate(draft.completedAt)}
                </span>
              )}
            </div>
            {/* Editable title */}
            <input
              value={draft.title}
              onChange={e => update("title", e.target.value)}
              style={{
                width: "100%", background: "transparent", border: "none", outline: "none",
                fontSize: 20, fontWeight: 700, color: "var(--color-f1)",
                fontFamily: "var(--font-display)", lineHeight: 1.3,
              }}
              placeholder="Título da CS..."
            />
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-f4)", padding: 4, borderRadius: 6, flexShrink: 0 }}
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 220px", gap: 20 }}>
          {/* Main: description */}
          <div>
            <label style={labelStyle}>Descrição / Visão</label>
            <textarea
              value={draft.description}
              onChange={e => update("description", e.target.value)}
              rows={9}
              placeholder={"Descreva como você imagina essa CS...\n\nComo funciona? O que resolve? Quais casos de uso?\nEssa descrição vira contexto para o agente implementar."}
              style={{
                width: "100%", background: "var(--color-bg)", border: "1px solid var(--color-border2)",
                borderRadius: 8, color: "var(--color-f1)", fontSize: 13, lineHeight: 1.6,
                padding: "10px 12px", resize: "vertical", fontFamily: "var(--font-body)",
                outline: "none", boxSizing: "border-box",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = style.accent + "88")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--color-border2)")}
            />

            {/* Checklist (CS-59) */}
            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>
                <IconListCheck size={11} style={{ display: "inline", marginRight: 3 }} />
                Checklist
                {draft.checklist.length > 0 && (
                  <span style={{ marginLeft: 6, color: "var(--color-f3)", textTransform: "none", letterSpacing: 0 }}>
                    {draft.checklist.filter(i => i.done).length}/{draft.checklist.length}
                  </span>
                )}
              </label>
              {draft.checklist.length > 0 && (
                <div style={{ height: 4, background: "var(--color-bg)", borderRadius: 2, marginBottom: 8, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 2, transition: "width 200ms",
                    width: `${(draft.checklist.filter(i => i.done).length / draft.checklist.length) * 100}%`,
                    background: draft.checklist.every(i => i.done) ? "#4ade80" : style.accent,
                  }} />
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                {draft.checklist.map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px", borderRadius: 6, background: "var(--color-bg)" }}>
                    <button
                      onClick={() => toggleCheckItem(item.id)}
                      style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: "pointer",
                        border: `1px solid ${item.done ? "#4ade80" : "var(--color-border2)"}`,
                        background: item.done ? "rgba(74,222,128,0.2)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                      }}
                    >
                      {item.done && <IconCheck size={11} color="#4ade80" />}
                    </button>
                    <span style={{
                      flex: 1, fontSize: 12, color: item.done ? "var(--color-f4)" : "var(--color-f2)",
                      textDecoration: item.done ? "line-through" : "none", lineHeight: 1.4,
                    }}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => removeCheckItem(item.id)}
                      title="Remover item"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-f4)", padding: 2, display: "flex" }}
                    >
                      <IconX size={11} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <input
                  value={checkInput}
                  onChange={e => setCheckInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCheckItem(); } }}
                  placeholder="nova subtarefa..."
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={addCheckItem}
                  style={{
                    background: "var(--color-bg3, #1e293b)", border: "1px solid var(--color-border2)",
                    borderRadius: 6, cursor: "pointer", color: "var(--color-f3)", padding: "0 8px",
                  }}
                >
                  <IconPlus size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar: metadata */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Column selector */}
            <div>
              <label style={labelStyle}>Coluna</label>
              <select
                value={draft.columnId}
                onChange={e => {
                  const newCol = e.target.value;
                  update("columnId", newCol);
                  if (newCol === "done" && !draft.completedAt) {
                    update("completedAt", new Date().toISOString());
                  }
                  if (newCol !== "done") {
                    update("completedAt", null);
                  }
                }}
                style={selectStyle}
              >
                {columns.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Version */}
            <div>
              <label style={labelStyle}>Versão</label>
              <input
                value={draft.version}
                onChange={e => update("version", e.target.value)}
                placeholder="ex: 1.14.0"
                style={inputStyle}
              />
            </div>

            {/* Commit */}
            <div>
              <label style={labelStyle}>
                <IconBrandGit size={11} style={{ display: "inline", marginRight: 3 }} />
                Commit hash
              </label>
              <input
                value={draft.commitHash}
                onChange={e => update("commitHash", e.target.value)}
                placeholder="ex: 54b3893"
                style={{ ...inputStyle, fontFamily: "monospace" }}
              />
            </div>

            {/* Dates (CS-59): started / due / completed */}
            <div>
              <label style={labelStyle}>
                <IconCalendar size={11} style={{ display: "inline", marginRight: 3 }} />
                Iniciada em
              </label>
              <input
                type="date"
                value={draft.startedAt ? draft.startedAt.slice(0, 10) : ""}
                onChange={e => update("startedAt", e.target.value ? new Date(e.target.value + "T12:00:00Z").toISOString() : null)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                <IconClock size={11} style={{ display: "inline", marginRight: 3 }} />
                Prazo
              </label>
              <input
                type="date"
                value={draft.dueAt ? draft.dueAt.slice(0, 10) : ""}
                onChange={e => update("dueAt", e.target.value ? new Date(e.target.value + "T12:00:00Z").toISOString() : null)}
                style={inputStyle}
              />
              {draft.dueAt && draft.columnId !== "done" && (
                <span style={{ fontSize: 10, color: dueChip(draft.dueAt).color, marginTop: 3, display: "block" }}>
                  {dueChip(draft.dueAt).text}
                </span>
              )}
            </div>

            <div>
              <label style={labelStyle}>
                <IconCalendar size={11} style={{ display: "inline", marginRight: 3 }} />
                Concluída em
              </label>
              <input
                type="date"
                value={draft.completedAt ? draft.completedAt.slice(0, 10) : ""}
                onChange={e => update("completedAt", e.target.value ? new Date(e.target.value + "T12:00:00Z").toISOString() : null)}
                style={inputStyle}
              />
            </div>

            {/* Labels */}
            <div>
              <label style={labelStyle}>
                <IconTag size={11} style={{ display: "inline", marginRight: 3 }} />
                Labels
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                {draft.labels.map(l => (
                  <button
                    key={l} onClick={() => removeLabel(l)}
                    style={{
                      display: "flex", alignItems: "center", gap: 3,
                      fontSize: 10, fontWeight: 600, padding: "2px 6px 2px 7px",
                      borderRadius: 4, cursor: "pointer",
                      background: labelColor(l) + "22", color: labelColor(l),
                      border: `1px solid ${labelColor(l)}44`,
                    }}
                  >
                    {l}
                    <IconX size={9} />
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <input
                  value={labelInput}
                  onChange={e => setLabelInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLabel(labelInput); } }}
                  placeholder="nova label..."
                  list="known-labels"
                  style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                />
                <button
                  onClick={() => addLabel(labelInput)}
                  style={{
                    background: "var(--color-bg3, #1e293b)", border: "1px solid var(--color-border2)",
                    borderRadius: 6, cursor: "pointer", color: "var(--color-f3)", padding: "0 8px",
                  }}
                >
                  <IconPlus size={13} />
                </button>
              </div>
              <datalist id="known-labels">
                {ALL_LABELS.map(l => <option key={l} value={l} />)}
              </datalist>
            </div>
          </div>
        </div>

        {/* Comments & activity (CS-59) */}
        <div style={{ borderTop: "1px solid var(--color-border)", padding: "16px 20px" }}>
          <label style={labelStyle}>
            <IconMessageCircle size={11} style={{ display: "inline", marginRight: 3 }} />
            Comentários e atividade
          </label>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <input
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addComment(); } }}
              placeholder="Escrever um comentário... (diário de bordo da CS)"
              style={{ ...inputStyle, flex: 1, fontSize: 13, padding: "8px 10px" }}
            />
            <button
              onClick={addComment}
              disabled={!commentInput.trim()}
              title="Enviar comentário"
              style={{
                background: commentInput.trim() ? style.accent : "var(--color-bg3, #1e293b)",
                color: commentInput.trim() ? "#0f172a" : "var(--color-f4)",
                border: "none", borderRadius: 7, cursor: commentInput.trim() ? "pointer" : "not-allowed",
                padding: "0 12px", display: "flex", alignItems: "center",
              }}
            >
              <IconSend size={14} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" }}>
            {[...draft.comments].reverse().map(c => (
              c.type === "activity" ? (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 4px" }}>
                  <IconArrowRight size={11} style={{ color: "var(--color-f4)", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "var(--color-f4)", fontStyle: "italic", flex: 1 }}>{c.text}</span>
                  <span style={{ fontSize: 10, color: "var(--color-f4)", opacity: 0.7, flexShrink: 0 }}>{stampDate(c.createdAt)}</span>
                </div>
              ) : (
                <div key={c.id} style={{
                  background: "var(--color-bg)", border: "1px solid var(--color-border)",
                  borderRadius: 8, padding: "8px 10px",
                }}>
                  <p style={{ margin: 0, fontSize: 12.5, color: "var(--color-f2)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{c.text}</p>
                  <span style={{ fontSize: 10, color: "var(--color-f4)", marginTop: 4, display: "block" }}>
                    {stampDate(c.createdAt)} · {relDate(c.createdAt)}
                  </span>
                </div>
              )
            ))}
            {draft.comments.length === 0 && (
              <span style={{ fontSize: 11, color: "var(--color-f4)", fontStyle: "italic" }}>
                Sem comentários ainda — movimentações entre colunas aparecem aqui automaticamente.
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: "1px solid var(--color-border)",
          padding: "12px 20px", display: "flex", alignItems: "center", gap: 8,
        }}>
          <button
            onClick={handleSave}
            disabled={!dirty || isPending}
            style={{
              background: dirty ? style.accent : "var(--color-bg3, #1e293b)",
              color: dirty ? "#0f172a" : "var(--color-f4)",
              border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13,
              padding: "8px 18px", cursor: dirty ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 150ms",
            }}
          >
            {isPending ? <IconLoader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <IconCheck size={14} />}
            {dirty ? "Salvar alterações" : "Salvo"}
          </button>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "var(--color-f4)" }}>Ctrl+S para salvar · Esc para fechar</span>
          <button
            onClick={handleDelete}
            style={{
              background: "rgba(248,113,113,0.1)", color: "#f87171",
              border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8,
              fontSize: 13, fontWeight: 600, padding: "7px 12px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <IconTrash size={13} />
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── New card form (inline) ── */
function NewCardForm({ columnId, onAdd, onCancel, accent }: {
  columnId: string; onAdd: (c: KanbanCard) => void; onCancel: () => void; accent: string;
}) {
  const [title, setTitle] = useState("");
  const [csNum, setCsNum] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  function submit() {
    if (!title.trim()) return;
    const card: KanbanCard = {
      id:          `card-${Date.now()}`,
      columnId,
      csNumber:    csNum.trim() || `CS-?`,
      title:       title.trim(),
      description: "",
      labels:      [],
      version:     "",
      commitHash:  "",
      completedAt: columnId === "done" ? new Date().toISOString() : null,
      order:       9999,
      startedAt:   columnId === "in-progress" ? new Date().toISOString() : null,
      dueAt:       null,
      checklist:   [],
      comments:    [],
    };
    onAdd(card);
  }

  return (
    <div style={{
      background: "var(--color-bg2)", border: `1px solid ${accent}66`,
      borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8,
    }}>
      <input
        value={csNum}
        onChange={e => setCsNum(e.target.value)}
        placeholder="CS-??"
        style={{
          background: "transparent", border: "none", borderBottom: "1px solid var(--color-border)",
          outline: "none", color: accent, fontSize: 12, fontWeight: 700, width: "80px",
          letterSpacing: "0.05em", paddingBottom: 2,
        }}
      />
      <input
        ref={ref}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
        placeholder="Título da CS..."
        style={{
          background: "transparent", border: "none", outline: "none",
          color: "var(--color-f1)", fontSize: 13, fontWeight: 500,
        }}
      />
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={submit}
          style={{
            background: accent, color: "#0f172a", border: "none", borderRadius: 6,
            fontSize: 12, fontWeight: 700, padding: "5px 14px", cursor: "pointer",
          }}
        >
          Adicionar
        </button>
        <button
          onClick={onCancel}
          style={{
            background: "none", border: "1px solid var(--color-border)", borderRadius: 6,
            fontSize: 12, color: "var(--color-f4)", padding: "5px 10px", cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

/* ── Shared input styles ── */
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--color-bg)", border: "1px solid var(--color-border2)",
  borderRadius: 7, color: "var(--color-f1)", fontSize: 12, padding: "6px 9px",
  outline: "none", boxSizing: "border-box",
};
const selectStyle: React.CSSProperties = { ...inputStyle };
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
  color: "var(--color-f4)", textTransform: "uppercase", marginBottom: 5,
};

/* ── Main KanbanBoard ── */
export function KanbanBoard({ initialBoard }: { initialBoard: KanbanBoard }) {
  const [board, setBoard] = useState<KanbanBoard>(initialBoard);
  const [activeModal, setActiveModal] = useState<KanbanCard | null>(null);
  const [addingIn, setAddingIn] = useState<string | null>(null);
  const [dragCardId, setDragCardId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [colSort, setColSort] = useState<Record<string, "asc" | "desc">>({
    "backlog":     "asc",
    "in-progress": "asc",
    "blocked":     "asc",
    "done":        "desc",   // Concluídas: mais recentes no topo por padrão
  });
  /* CS-59: label filter (OR semantics across selected labels) */
  const [activeLabels, setActiveLabels] = useState<Set<string>>(new Set());
  /* CS-59: expanded release groups in Done; null = default (newest only) */
  const [expandedReleases, setExpandedReleases] = useState<Set<string> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* labels present on the board, most used first */
  const allLabels = useMemo(() => {
    const freq = new Map<string, number>();
    for (const c of board.cards) for (const l of c.labels) freq.set(l, (freq.get(l) ?? 0) + 1);
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([l]) => l);
  }, [board.cards]);

  function toggleLabelFilter(label: string) {
    setActiveLabels(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  }

  /* auto-save with debounce */
  function persistBoard(next: KanbanBoard) {
    setBoard(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await saveKanbanBoard(next);
      setSaving(false);
    }, 800);
  }

  /* CS-59: column-move side effects — activity log entry + startedAt auto-fill */
  function applyMoveEffects(card: KanbanCard, fromColId: string, toColId: string): KanbanCard {
    const fromTitle = board.columns.find(c => c.id === fromColId)?.title ?? fromColId;
    const toTitle   = board.columns.find(c => c.id === toColId)?.title ?? toColId;
    let moved: KanbanCard = {
      ...card,
      startedAt: toColId === "in-progress" && !card.startedAt ? new Date().toISOString() : card.startedAt,
    };
    moved = withActivity(moved, `Movida de "${fromTitle}" para "${toTitle}"`);
    return moved;
  }

  /* move card to column */
  function handleDrop(targetColId: string) {
    if (!dragCardId) return;
    const card = board.cards.find(c => c.id === dragCardId);
    if (!card || card.columnId === targetColId) { setDragCardId(null); setDragOverCol(null); return; }

    let updatedCard: KanbanCard = {
      ...card,
      columnId: targetColId,
      completedAt: targetColId === "done" && !card.completedAt ? new Date().toISOString() : (targetColId !== "done" ? null : card.completedAt),
    };
    updatedCard = applyMoveEffects(updatedCard, card.columnId, targetColId);
    const next: KanbanBoard = {
      ...board,
      cards: board.cards.map(c => c.id === dragCardId ? updatedCard : c),
    };
    persistBoard(next);
    setDragCardId(null);
    setDragOverCol(null);
  }

  /* save card from modal */
  function handleSaveCard(updated: KanbanCard): KanbanCard {
    const before = board.cards.find(c => c.id === updated.id);
    const final = before && before.columnId !== updated.columnId
      ? applyMoveEffects(updated, before.columnId, updated.columnId)
      : updated;
    const next: KanbanBoard = {
      ...board,
      cards: board.cards.map(c => c.id === final.id ? final : c),
    };
    persistBoard(next);
    setActiveModal(final);
    return final;
  }

  /* delete card */
  function handleDeleteCard(id: string) {
    const next: KanbanBoard = { ...board, cards: board.cards.filter(c => c.id !== id) };
    persistBoard(next);
    setActiveModal(null);
  }

  /* add new card */
  function handleAddCard(card: KanbanCard) {
    // compute order: max in column + 1
    const colCards = board.cards.filter(c => c.columnId === card.columnId);
    const maxOrder = colCards.reduce((mx, c) => Math.max(mx, c.order), -1);
    const withOrder = { ...card, order: maxOrder + 1 };
    const next: KanbanBoard = { ...board, cards: [...board.cards, withOrder] };
    persistBoard(next);
    setAddingIn(null);
  }

  /* cards per column, sorted (and filtered by active labels) */
  function colCards(colId: string) {
    const dir = colSort[colId] ?? "asc";
    return board.cards
      .filter(c => c.columnId === colId)
      .filter(c => activeLabels.size === 0 || c.labels.some(l => activeLabels.has(l)))
      .sort((a, b) => {
        // primary key: completedAt for done column, order for others
        const aKey = colId === "done" && a.completedAt
          ? new Date(a.completedAt).getTime()
          : a.order;
        const bKey = colId === "done" && b.completedAt
          ? new Date(b.completedAt).getTime()
          : b.order;
        if (aKey !== bKey) return dir === "asc" ? aKey - bKey : bKey - aKey;
        // tiebreaker: higher order = added later = more recent
        return dir === "asc" ? a.order - b.order : b.order - a.order;
      });
  }

  function toggleSort(colId: string) {
    setColSort(prev => ({ ...prev, [colId]: prev[colId] === "asc" ? "desc" : "asc" }));
  }

  const sorted = [...board.columns].sort((a, b) => a.order - b.order);

  return (
    <div style={{ position: "relative" }}>
      {/* top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 0 20px 0",
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--color-f1)" }}>
            Roadmap de Change Specs
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "var(--color-f4)" }}>
            {board.cards.length} cards · persistido em{" "}
            <code style={{ fontSize: 11, color: "var(--color-cyan)" }}>docs/cs-board.json</code>
            {saving && <span style={{ marginLeft: 8, color: "var(--color-f4)" }}>
              <IconLoader2 size={10} style={{ animation: "spin 1s linear infinite", display: "inline", marginRight: 3 }} />
              salvando…
            </span>}
          </p>
        </div>
      </div>

      {/* Label filter chips (CS-59) */}
      {allLabels.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", padding: "0 0 16px 0" }}>
          <IconTag size={12} style={{ color: "var(--color-f4)", flexShrink: 0 }} />
          {allLabels.map(l => {
            const active = activeLabels.has(l);
            const col = labelColor(l);
            return (
              <button
                key={l}
                onClick={() => toggleLabelFilter(l)}
                style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.02em",
                  padding: "2px 8px", borderRadius: 10, cursor: "pointer",
                  background: active ? col + "33" : "rgba(255,255,255,0.03)",
                  color: active ? col : "var(--color-f4)",
                  border: `1px solid ${active ? col : "var(--color-border)"}`,
                  transition: "all 120ms",
                }}
              >
                {l}
              </button>
            );
          })}
          {activeLabels.size > 0 && (
            <button
              onClick={() => setActiveLabels(new Set())}
              style={{
                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10,
                cursor: "pointer", background: "none", color: "var(--color-f3)",
                border: "1px solid var(--color-border2)", display: "flex", alignItems: "center", gap: 3,
              }}
            >
              <IconX size={9} />
              limpar filtro
            </button>
          )}
        </div>
      )}

      {/* board */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${sorted.length}, minmax(260px, 1fr))`,
        gap: 16,
        overflowX: "auto",
        paddingBottom: 8,
      }}>
        {sorted.map(col => {
          const cards   = colCards(col.id);
          const style   = COLUMN_STYLES[col.id] ?? COLUMN_STYLES["backlog"];
          const isOver  = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              onDragOver={e => { e.preventDefault(); setDragOverCol(col.id); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={() => handleDrop(col.id)}
              style={{
                background: isOver ? style.accent + "0d" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isOver ? style.accent + "55" : "var(--color-border)"}`,
                borderRadius: 12,
                padding: "14px 12px",
                minHeight: 200,
                transition: "all 150ms",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {/* Column header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%", background: style.accent,
                    boxShadow: `0 0 6px ${style.accent}88`, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-f1)" }}>
                    {col.title}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, background: style.badge,
                    color: style.accent, padding: "1px 7px", borderRadius: 10,
                  }}>
                    {cards.length}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {/* Sort toggle */}
                  <button
                    onClick={() => toggleSort(col.id)}
                    title={colSort[col.id] === "asc" ? "Mais antigas primeiro — clique para inverter" : "Mais novas primeiro — clique para inverter"}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--color-f4)", padding: "2px 4px", borderRadius: 4,
                      display: "flex", alignItems: "center", gap: 3, fontSize: 10,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = style.accent; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--color-f4)"; }}
                  >
                    {colSort[col.id] === "asc"
                      ? <><IconSortAscending size={13} /><span style={{ fontSize: 9, letterSpacing: "0.03em" }}>antigas</span></>
                      : <><IconSortDescending size={13} /><span style={{ fontSize: 9, letterSpacing: "0.03em" }}>novas</span></>
                    }
                  </button>
                  {/* Add card */}
                  <button
                    onClick={() => setAddingIn(addingIn === col.id ? null : col.id)}
                    title="Adicionar card"
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--color-f4)", padding: 2, borderRadius: 4,
                      display: "flex",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = style.accent)}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--color-f4)")}
                  >
                    <IconPlus size={14} />
                  </button>
                </div>
              </div>

              {/* New card form */}
              {addingIn === col.id && (
                <NewCardForm
                  columnId={col.id}
                  onAdd={handleAddCard}
                  onCancel={() => setAddingIn(null)}
                  accent={style.accent}
                />
              )}

              {/* Cards — Done groups by release (CS-59); other columns stay flat */}
              {(() => {
                const renderCard = (card: KanbanCard) => (
                  <KanbanCardItem
                    key={card.id}
                    card={card}
                    colAccent={style.accent}
                    onDragStart={e => {
                      e.dataTransfer.setData("cardId", card.id);
                      setDragCardId(card.id);
                      (e.currentTarget as HTMLElement).style.opacity = "0.4";
                    }}
                    onDragEnd={e => {
                      (e.currentTarget as HTMLElement).style.opacity = "1";
                      setDragCardId(null);
                      setDragOverCol(null);
                    }}
                    onClick={() => setActiveModal(card)}
                  />
                );
                if (col.id !== "done") return cards.map(renderCard);

                const groups = groupByRelease(cards);
                // Default (before any manual toggle): only the newest release open.
                const expanded = expandedReleases ?? new Set(groups.length ? [groups[0].release] : []);
                const toggleRelease = (release: string) => {
                  const next = new Set(expanded);
                  if (next.has(release)) next.delete(release); else next.add(release);
                  setExpandedReleases(next);
                };
                return groups.map(g => {
                  const isOpen = expanded.has(g.release);
                  const title = g.release ? `v${g.release.replace(/^v/, "")}` : "Sem release";
                  return (
                    <div key={g.release || "__none"} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button
                        onClick={() => toggleRelease(g.release)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          background: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)",
                          borderRadius: 8, padding: "5px 9px", cursor: "pointer", width: "100%",
                        }}
                      >
                        {isOpen ? <IconChevronDown size={12} style={{ color: style.accent }} /> : <IconChevronRight size={12} style={{ color: "var(--color-f4)" }} />}
                        <span style={{ fontSize: 11, fontWeight: 700, color: isOpen ? style.accent : "var(--color-f3)", letterSpacing: "0.03em" }}>
                          {title}
                        </span>
                        <span style={{
                          fontSize: 9, fontWeight: 700, marginLeft: "auto",
                          background: style.badge, color: style.accent,
                          padding: "1px 6px", borderRadius: 8,
                        }}>
                          {g.cards.length}
                        </span>
                      </button>
                      {isOpen && g.cards.map(renderCard)}
                    </div>
                  );
                });
              })()}

              {/* Empty state */}
              {cards.length === 0 && addingIn !== col.id && (
                <div style={{
                  border: `2px dashed ${style.accent}33`, borderRadius: 8,
                  padding: "20px 12px", textAlign: "center",
                  color: "var(--color-f4)", fontSize: 12,
                }}>
                  Solte um card aqui
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {activeModal && (
        <CardModal
          card={activeModal}
          columns={board.columns}
          onClose={() => setActiveModal(null)}
          onSave={handleSaveCard}
          onDelete={handleDeleteCard}
        />
      )}
    </div>
  );
}

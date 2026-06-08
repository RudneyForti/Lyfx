"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { adminLogin, adminLogout, adminResetPassword, adminDeleteUser, adminCreateUser, setAppConfig, saveAdminNotes, adminSendNotification, adminGetManualNotifications, adminDeleteNotification, adminUpdateNotification, adminGetEventLog, getServerMetrics, getAdminSecurityLog } from "./actions";
import type { LiveSchema, AppConfigEntry, NotifBroadcast, AuditEvent, ServerMetrics, AdminSecurityEvent, KanbanBoard } from "./actions";
import { KanbanBoard as KanbanBoardComponent } from "@/components/studio/KanbanBoard";
import { createPlan, updatePlan, deletePlan, assignUserToPlan, ensureDefaultPlan, ensureInsiderPlan, migrateAndDeletePlan } from "@/app/actions/plans";
import { ALL_MODULES } from "@/lib/modules";
import {
  IconLock, IconLoader2, IconX, IconLogout, IconDatabase,
  IconUsers, IconTable, IconKey, IconTrash, IconChevronDown, IconChevronRight,
  IconFileDescription, IconUserPlus, IconFilter, IconPackage, IconPlus, IconEdit,
  IconCheck, IconZoomIn, IconApps, IconAdjustments, IconPencil, IconStar, IconBell, IconSend,
  IconShieldCheck, IconShieldX, IconShieldExclamation, IconShieldLock, IconRefresh,
  IconLayoutKanban,
} from "@tabler/icons-react";

/* ── Login gate ── */
export function StudioLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await adminLogin(password);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--color-bg)" }}>
      {/* back to login */}
      <Link
        href="/login"
        style={{
          position: "fixed", top: 20, left: 20,
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 12, color: "var(--color-f4)",
          textDecoration: "none", padding: "6px 10px",
          borderRadius: 8, border: "1px solid var(--color-border)",
          background: "var(--color-bg2)",
          transition: "color 150ms",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--color-f2)")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--color-f4)")}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Login
      </Link>
      <div style={{ width: 340, background: "var(--color-bg2)", border: "1px solid var(--color-border2)", borderRadius: 16, padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <span style={{ background: "rgba(34,211,238,0.1)", border: "1px solid var(--color-cyan-border)", borderRadius: 8, padding: "6px 8px", display: "flex" }}>
            <IconLock size={16} style={{ color: "var(--color-cyan)" }} />
          </span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-f1)" }}>Studio</div>
            <div style={{ fontSize: 11, color: "var(--color-f4)", letterSpacing: 1 }}>ACESSO RESTRITO</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="password"
            placeholder="Senha de administrador"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            style={{
              height: 42, background: "var(--color-bg3)", border: "1px solid var(--color-border2)",
              borderRadius: 8, padding: "0 14px", fontSize: 13, color: "var(--color-f1)",
              outline: "none", width: "100%",
            }}
          />
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--color-red)" }}>
              <IconX size={11} />{error}
            </div>
          )}
          <button
            type="submit"
            disabled={isPending}
            style={{
              height: 42, background: "var(--color-cyan)", color: "#083344",
              border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            {isPending ? <IconLoader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <IconLock size={15} />}
            Entrar no Studio
          </button>
        </form>
      </div>
    </div>
  );
}


/* ── Logout button ── */
function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => adminLogout())}
      disabled={isPending}
      style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-f3)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6 }}
      onMouseEnter={e => (e.currentTarget.style.color = "var(--color-f1)")}
      onMouseLeave={e => (e.currentTarget.style.color = "var(--color-f3)")}
    >
      {isPending ? <IconLoader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <IconLogout size={14} />}
      Sair
    </button>
  );
}

/* ── Main studio ── */
type StudioData = Awaited<ReturnType<typeof import("./actions").getStudioData>>;
type PlanItem = StudioData["plans"][number];

export function StudioMain({ data, docs, liveSchema, appConfig, kanbanBoard }: { data: StudioData; docs: string; liveSchema: LiveSchema; appConfig: AppConfigEntry[]; kanbanBoard: KanbanBoard }) {
  const [tab, setTab] = useState<"schema" | "users" | "plans" | "modules" | "panel" | "notes" | "data" | "docs" | "notifications" | "security" | "roadmap">("panel");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const tabs = [
    { key: "panel",         label: "Painel",         icon: <IconAdjustments size={14} /> },
    { key: "users",         label: "Usuários",       icon: <IconUsers size={14} /> },
    { key: "plans",         label: "Planos",         icon: <IconPackage size={14} /> },
    { key: "modules",       label: "Módulos",        icon: <IconApps size={14} /> },
    { key: "notifications", label: "Notificações",   icon: <IconBell size={14} /> },
    { key: "security",      label: "Segurança",      icon: <IconShieldCheck size={14} /> },
    { key: "roadmap",       label: "Roadmap",        icon: <IconLayoutKanban size={14} /> },
    { key: "notes",         label: "Notas",          icon: <IconPencil size={14} /> },
    { key: "data",          label: "Dados",          icon: <IconTable size={14} /> },
    { key: "schema",        label: "Schema",         icon: <IconDatabase size={14} /> },
    { key: "docs",          label: "Documentação",   icon: <IconFileDescription size={14} /> },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-f1)", fontFamily: "var(--font-body)" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg2)", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700, fontStyle: "italic", fontFamily: "var(--font-display)" }}>
            Ly<span style={{ color: "var(--color-cyan)" }}>fx</span>
          </span>
          <span style={{ color: "var(--color-border2)", margin: "0 4px" }}>/</span>
          <span style={{ fontSize: 12, color: "var(--color-f3)", letterSpacing: 1 }}>STUDIO</span>
        </div>
        <LogoutButton />
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg2)", padding: "0 28px", display: "flex", gap: 0 }}>
        {tabs.map(t => {
          const isActive = tab === t.key;
          const isHov   = hoveredTab === t.key && !isActive;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              onMouseEnter={() => setHoveredTab(t.key)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "12px 16px", fontSize: 13, cursor: "pointer",
                background: isHov ? "rgba(255,255,255,0.03)" : "none",
                border: "none",
                color: isActive ? "var(--color-f1)" : isHov ? "var(--color-f2)" : "var(--color-f3)",
                borderBottom: isActive ? "2px solid var(--color-cyan)" : "2px solid transparent",
                transition: "all 150ms",
                borderRadius: "6px 6px 0 0",
              }}
            >
              {t.icon}{t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: tab === "docs" || tab === "notes" ? 0 : 28, maxWidth: tab === "docs" || tab === "schema" || tab === "notes" || tab === "panel" || tab === "roadmap" ? "none" : 900 }}>
        {tab === "schema"        && <SchemaTab expanded={expanded} setExpanded={setExpanded} liveSchema={liveSchema} />}
        {tab === "users"         && <UsersTab users={data.users} plans={data.plans} />}
        {tab === "plans"         && <PlansTab plans={data.plans} users={data.users} />}
        {tab === "modules"       && <ModulesTab data={data} appConfig={appConfig} />}
        {tab === "panel"         && <ControlPanelTab appConfig={appConfig} data={data} />}
        {tab === "notifications" && <NotificationsTab users={data.users} plans={data.plans} />}
        {tab === "security"      && <SecurityTab users={data.users} />}
        {tab === "roadmap"       && <KanbanBoardComponent initialBoard={kanbanBoard} />}
        {tab === "notes"         && <NotesTab appConfig={appConfig} />}
        {tab === "data"          && <DataTab data={data} />}
        {tab === "docs"          && <DocsTab content={docs} />}
      </div>
    </div>
  );
}

/* ── ERD Diagram — responsive, full fields, column-level FK arrows ── */

const TABLE_COLORS: Record<string, string> = {
  User: "#22D3EE", Plan: "#A78BFA", PlanModule: "#818CF8",
  Transaction: "#A3E635", Tag: "#FBBF24", TransactionTag: "#FB923C",
  Budget: "#F472B6", Goal: "#34D399", GoalPayment: "#6EE7B7",
  Institution: "#60A5FA", Account: "#93C5FD",
  Asset: "#FCA5A5", AssetExpense: "#F87171",
  Liability: "#E879F9", PillProgress: "#FDE68A", Settings: "#94A3B8",
};
function tableColor(name: string) { return TABLE_COLORS[name] ?? "#64748B"; }

// Logical column grouping — FK arrows only cross adjacent columns (no long jumps)
// Account→Institution (col2→col1 | 1 step), Goal→User (col3→col2 | 1 step)
const COL_ASSIGN: Record<string, number> = {
  Transaction: 0, TransactionTag: 0, Tag: 0,
  Institution: 1, Liability: 1, Budget: 1,
  User: 2, Account: 2, Settings: 2, PillProgress: 2,
  Asset: 3, AssetExpense: 3, Goal: 3, GoalPayment: 3,
  Plan: 4, PlanModule: 4,
};

const ERD_BOX_W    = 175;
const ERD_HEADER_H = 26;
const ERD_ROW_H    = 16;
const ERD_COL_GAP  = 50; // must be > 44 so same-column arcs (cx+44) don't invade next column
const ERD_ROW_GAP  = 12;
const ERD_PAD      = 16;
const ERD_N_COLS   = 5;

function erdType(t: string): string {
  if (t.includes("character") || t === "text") return "str";
  if (t === "integer") return "int";
  if (t === "bigint") return "i64";
  if (t.includes("double") || t === "numeric") return "flt";
  if (t === "boolean") return "bool";
  if (t.includes("timestamp")) return "dt";
  if (t === "uuid") return "uuid";
  if (t === "jsonb") return "json";
  return t.slice(0, 4);
}
function trunc(s: string, n = 17) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

type BoxPos = { col: number; x: number; y: number; height: number };

function computeErdLayout(tables: LiveSchema["tables"], effectiveHeights?: Map<string, number>) {
  // Group by column
  const cols = new Map<number, typeof tables>();
  for (let i = 0; i < ERD_N_COLS; i++) cols.set(i, []);
  for (const t of tables) cols.get(COL_ASSIGN[t.name] ?? 0)!.push(t);
  // Sort each col: tallest first for visual balance (by actual column count, not effective height)
  for (const [, arr] of cols) arr.sort((a, b) => b.columns.length - a.columns.length);

  const colY = Array(ERD_N_COLS).fill(ERD_PAD);
  const positions = new Map<string, BoxPos>();

  for (const [colIdx, arr] of cols) {
    for (const t of arr) {
      const height = effectiveHeights?.get(t.name) ?? (ERD_HEADER_H + t.columns.length * ERD_ROW_H);
      const x = ERD_PAD + colIdx * (ERD_BOX_W + ERD_COL_GAP);
      positions.set(t.name, { col: colIdx, x, y: colY[colIdx], height });
      colY[colIdx] += height + ERD_ROW_GAP;
    }
  }

  const CANVAS_W = ERD_PAD * 2 + ERD_N_COLS * ERD_BOX_W + (ERD_N_COLS - 1) * ERD_COL_GAP;
  const CANVAS_H = Math.max(...colY) + ERD_PAD;
  return { positions, CANVAS_W, CANVAS_H };
}

function ErdDiagram({ liveSchema }: { liveSchema: LiveSchema }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(liveSchema.tables.map(t => t.name))
  );

  // Collapsed tables render header-only — recompute layout on every toggle
  const effectiveHeights = new Map<string, number>();
  for (const t of liveSchema.tables) {
    effectiveHeights.set(t.name, collapsed.has(t.name) ? ERD_HEADER_H : ERD_HEADER_H + t.columns.length * ERD_ROW_H);
  }

  const { positions, CANVAS_W, CANVAS_H } = computeErdLayout(liveSchema.tables, effectiveHeights);

  // Build column-level FK arrows
  const drawnKeys = new Set<string>();
  const arrows: React.ReactElement[] = [];

  for (const fk of liveSchema.foreignKeys) {
    const key = `${fk.table_name}.${fk.column_name}→${fk.foreign_table_name}.${fk.foreign_column_name}`;
    if (drawnKeys.has(key) || fk.table_name === fk.foreign_table_name) continue;
    drawnKeys.add(key);

    const src = positions.get(fk.table_name);
    const dst = positions.get(fk.foreign_table_name);
    if (!src || !dst) continue;

    const srcTable = liveSchema.tables.find(t => t.name === fk.table_name);
    const dstTable = liveSchema.tables.find(t => t.name === fk.foreign_table_name);
    const srcColIdx = srcTable?.columns.findIndex(c => c.column_name === fk.column_name) ?? 0;
    const dstColIdx = dstTable?.columns.findIndex(c => c.column_name === fk.foreign_column_name) ?? 0;

    // When collapsed, point to header centre instead of the now-hidden row
    const srcRowY = collapsed.has(fk.table_name)
      ? src.y + ERD_HEADER_H / 2
      : src.y + ERD_HEADER_H + Math.max(0, srcColIdx) * ERD_ROW_H + ERD_ROW_H / 2;
    const dstRowY = collapsed.has(fk.foreign_table_name)
      ? dst.y + ERD_HEADER_H / 2
      : dst.y + ERD_HEADER_H + Math.max(0, dstColIdx) * ERD_ROW_H + ERD_ROW_H / 2;
    const color = tableColor(fk.table_name);

    let x1: number, x2: number;
    let cp1x: number, cp2x: number;

    if (src.col === dst.col) {
      // Same column — arc to the right.
      // ERD_COL_GAP=50 ensures the 44px arc never enters the next column's area.
      x1 = src.x + ERD_BOX_W; x2 = dst.x + ERD_BOX_W;
      const cx = src.x + ERD_BOX_W + 44;
      arrows.push(
        <g key={key}>
          <path d={`M ${x1} ${srcRowY} C ${cx} ${srcRowY} ${cx} ${dstRowY} ${x2} ${dstRowY}`}
            stroke={color} strokeOpacity={0.5} strokeWidth={1.5} fill="none" strokeDasharray="4 3" />
          <circle cx={x2} cy={dstRowY} r={3} fill={color} fillOpacity={0.8} />
        </g>
      );
      continue;
    }

    const goRight = src.col < dst.col;
    x1 = goRight ? src.x + ERD_BOX_W : src.x;
    x2 = goRight ? dst.x             : dst.x + ERD_BOX_W;
    const dist = Math.abs(x2 - x1);
    cp1x = goRight ? x1 + dist * 0.45 : x1 - dist * 0.45;
    cp2x = goRight ? x2 - dist * 0.45 : x2 + dist * 0.45;

    arrows.push(
      <g key={key}>
        <path d={`M ${x1} ${srcRowY} C ${cp1x} ${srcRowY} ${cp2x} ${dstRowY} ${x2} ${dstRowY}`}
          stroke={color} strokeOpacity={0.45} strokeWidth={1.5} fill="none" />
        <circle cx={x2} cy={dstRowY} r={3} fill={color} fillOpacity={0.8} />
      </g>
    );
  }

  function toggleCollapse(name: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  return (
    <div style={{ background: "var(--color-bg3)", border: "1px solid var(--color-border)", borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
      <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: "var(--color-f4)", letterSpacing: 1, textTransform: "uppercase" }}>
          Diagrama ER · {liveSchema.tables.length} tabelas · {liveSchema.foreignKeys.length} foreign keys · gerado em tempo real
        </span>
        <span style={{ fontSize: 10, color: "var(--color-f4)", display: "flex", alignItems: "center", gap: 4 }}>
          <IconZoomIn size={10} /> clique para colapsar · expandir
        </span>
      </div>

      {/* Horizontal scroll on narrow screens; natural fixed size on wide screens */}
      <div style={{ overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: "block" }}
        >
          {/* Arrows drawn first — behind table boxes */}
          {arrows}

          {/* Table boxes */}
          {liveSchema.tables.map(t => {
            const pos = positions.get(t.name);
            if (!pos) return null;
            const color = tableColor(t.name);
            const isHov = hovered === t.name;
            const isCollapsed = collapsed.has(t.name);
            const boxH = isCollapsed ? ERD_HEADER_H : ERD_HEADER_H + t.columns.length * ERD_ROW_H;

            return (
              <g key={t.name} transform={`translate(${pos.x},${pos.y})`}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovered(t.name)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => toggleCollapse(t.name)}
              >
                {isHov && <rect x={-2} y={-2} width={ERD_BOX_W + 4} height={boxH + 4} rx={5} fill={color} fillOpacity={0.1} />}

                <rect width={ERD_BOX_W} height={boxH} rx={4}
                  fill="#0d1117"
                  stroke={isHov ? color : color + "55"}
                  strokeWidth={isHov ? 1.5 : 1}
                />

                {/* Header bar */}
                <rect width={ERD_BOX_W} height={ERD_HEADER_H} rx={4} fill={color + "28"} />
                {!isCollapsed && <rect y={ERD_HEADER_H - 1} width={ERD_BOX_W} height={1} fill={color + "66"} />}
                {/* Top colour stripe */}
                <rect width={ERD_BOX_W} height={3} rx={4} fill={color} />

                <text x={8} y={18} fontSize={11} fontWeight={700} fill={color} fontFamily="monospace">{trunc(t.name, 19)}</text>
                <text x={ERD_BOX_W - 5} y={18} fontSize={8.5} fill={color} fillOpacity={0.65} textAnchor="end" fontFamily="monospace">
                  {isCollapsed ? "▶ " : "▼ "}{t.columns.length}f
                </text>

                {/* Field rows — hidden when collapsed */}
                {!isCollapsed && t.columns.map((c, i) => {
                  const ry = ERD_HEADER_H + i * ERD_ROW_H;
                  const isPk = c.is_pk, isFk = c.is_fk;
                  const textColor = isPk ? "#22D3EE" : isFk ? "#A78BFA" : "rgba(255,255,255,0.6)";
                  return (
                    <g key={c.column_name} transform={`translate(0,${ry})`}>
                      {i % 2 !== 0 && <rect width={ERD_BOX_W} height={ERD_ROW_H} fill="rgba(255,255,255,0.022)" />}
                      {isPk  && <circle cx={8} cy={ERD_ROW_H / 2} r={3.5} fill="#22D3EE" />}
                      {!isPk && isFk && <circle cx={8} cy={ERD_ROW_H / 2} r={3} fill="none" stroke="#A78BFA" strokeWidth={1.2} />}
                      {!isPk && !isFk && <circle cx={8} cy={ERD_ROW_H / 2} r={1.5} fill="rgba(255,255,255,0.18)" />}
                      <text x={18} y={ERD_ROW_H - 4} fontSize={9.5} fill={textColor} fontFamily="monospace">{trunc(c.column_name, 16)}</text>
                      <text x={ERD_BOX_W - 5} y={ERD_ROW_H - 4} fontSize={8} fill="rgba(255,255,255,0.3)" textAnchor="end" fontFamily="monospace">{erdType(c.data_type)}</text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/* ── Schema Tab ── */
const TABLE_DESCRIPTIONS: Record<string, string> = {
  User:           "Contas de usuário — credenciais, perfil e plano de acesso.",
  Plan:           "Planos de acesso — define quais módulos ficam disponíveis para um grupo de usuários.",
  PlanModule:     "Associação entre plano e módulo habilitado nele.",
  Transaction:    "Registro financeiro de entrada ou saída, com data, categoria e valor.",
  TransactionTag: "Associação N:N entre transações e tags.",
  Tag:            "Etiqueta personalizada para categorizar e filtrar transações.",
  Budget:         "Limite de gasto mensal por categoria definido pelo usuário.",
  Goal:           "Meta financeira com valor-alvo, prazo e histórico de aportes.",
  GoalPayment:    "Parcela de aporte vinculada a uma meta financeira.",
  Institution:    "Banco, corretora ou instituição financeira cadastrada pelo usuário.",
  Account:        "Conta bancária ou cartão associado a uma instituição.",
  Liability:      "Dívida, financiamento ou parcelamento em aberto.",
  Asset:          "Bem físico (imóvel, veículo) com valor de compra e valor atual.",
  AssetExpense:   "Despesa recorrente associada a um bem (IPTU, IPVA, seguro, manutenção, etc.).",
  PillProgress:   "Progresso do usuário em pílulas de educação financeira gamificadas.",
  Settings:       "Preferências financeiras do usuário (renda esperada, reserva de emergência).",
  AppConfig:      "Configurações globais do aplicativo armazenadas como pares chave-valor.",
};

function SchemaTab({ expanded, setExpanded, liveSchema }: {
  expanded: string | null;
  setExpanded: (v: string | null) => void;
  liveSchema: LiveSchema;
}) {

  // Type label mapping
  function pgTypeLabel(t: string) {
    const map: Record<string, string> = {
      "character varying": "String",
      "text": "String",
      "integer": "Int",
      "bigint": "BigInt",
      "double precision": "Float",
      "boolean": "Boolean",
      "timestamp without time zone": "DateTime",
      "timestamp with time zone": "DateTime",
      "uuid": "String(uuid)",
      "jsonb": "Json",
    };
    return map[t] ?? t;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Modelo de dados</div>
        <div style={{ fontSize: 13, color: "var(--color-f3)" }}>
          PostgreSQL · Prisma v7 · {liveSchema.tables.length} tabelas · gerado em tempo real
        </div>
      </div>

      {/* ERD Diagram */}
      <ErdDiagram liveSchema={liveSchema} />

      {/* Table cards — constrained for readability, with consistent spacing */}
      <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 10 }}>
      {liveSchema.tables.map(t => {
        const open = expanded === t.name;
        const color = tableColor(t.name);
        return (
          <div
            key={t.name}
            style={{ background: "var(--color-bg2)", border: `1px solid ${open ? color + "55" : "var(--color-border)"}`, borderRadius: 10, overflow: "hidden", transition: "border-color 200ms" }}
          >
            <button
              onClick={() => setExpanded(open ? null : t.name)}
              style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-f1)", flex: 1 }}>{t.name}</span>
                <span style={{ fontSize: 11, color: "var(--color-f4)" }}>{t.columns.length} campos</span>
                <span style={{ color: "var(--color-f4)" }}>
                  {open ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                </span>
              </div>
              {TABLE_DESCRIPTIONS[t.name] && (
                <div style={{ marginLeft: 22, fontSize: 11, color: "var(--color-f4)", lineHeight: 1.4 }}>
                  {TABLE_DESCRIPTIONS[t.name]}
                </div>
              )}
            </button>
            {open && (
              <div style={{ borderTop: "1px solid var(--color-border)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "var(--color-bg3)" }}>
                      <th style={{ padding: "6px 16px", textAlign: "left", color: "var(--color-f4)", fontWeight: 500, width: "8%" }}></th>
                      <th style={{ padding: "6px 16px", textAlign: "left", color: "var(--color-f4)", fontWeight: 500, width: "26%" }}>Campo</th>
                      <th style={{ padding: "6px 16px", textAlign: "left", color: "var(--color-f4)", fontWeight: 500, width: "20%" }}>Tipo</th>
                      <th style={{ padding: "6px 16px", textAlign: "left", color: "var(--color-f4)", fontWeight: 500, width: "12%" }}>Nullable</th>
                      <th style={{ padding: "6px 16px", textAlign: "left", color: "var(--color-f4)", fontWeight: 500 }}>Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.columns.map((c, i) => (
                      <tr key={c.column_name} style={{ borderTop: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                        {/* PK / FK badges */}
                        <td style={{ padding: "6px 16px" }}>
                          <div style={{ display: "flex", gap: 3 }}>
                            {c.is_pk && (
                              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 999, background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.4)", color: "#22D3EE", fontWeight: 700, letterSpacing: 0.3 }}>PK</span>
                            )}
                            {c.is_fk && (
                              <span title={`→ ${c.fk_ref}`} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 999, background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.4)", color: "#A78BFA", fontWeight: 700, letterSpacing: 0.3, cursor: "help" }}>FK</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: "7px 16px", fontFamily: "monospace", color: c.is_pk ? "#22D3EE" : c.is_fk ? "#A78BFA" : color }}>{c.column_name}</td>
                        <td style={{ padding: "7px 16px", fontFamily: "monospace", color: "var(--color-f3)", fontSize: 11 }}>{pgTypeLabel(c.data_type)}</td>
                        <td style={{ padding: "7px 16px", color: c.is_nullable === "YES" ? "var(--color-f4)" : "var(--color-cyan)", fontSize: 11 }}>
                          {c.is_nullable === "YES" ? "nullable" : "required"}
                        </td>
                        <td style={{ padding: "7px 16px", fontFamily: "monospace", color: "var(--color-f4)", fontSize: 11 }}>
                          {c.column_default ? c.column_default.replace(/^'(.*)'::.*$/, "$1").slice(0, 40) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
      </div>{/* end maxWidth:900 cards wrapper */}
    </div>
  );
}

/* ── Plan Dropdown (identity-styled) ── */
function PlanDropdown({ plans, value, isPending, onChange, onClose }: {
  plans: PlanItem[];
  value: string;
  isPending: boolean;
  onChange: (planId: string) => void;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const options = [{ id: "", name: "Sem plano", color: "" }, ...plans];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onClose();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const selected = options.find(o => o.id === value) ?? options[0];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          height: 28, display: "flex", alignItems: "center", gap: 6,
          padding: "0 10px", fontSize: 11, borderRadius: 6, cursor: "pointer",
          background: "var(--color-bg3)", border: `1px solid ${open ? "rgba(34,211,238,0.4)" : "var(--color-border2)"}`,
          color: "var(--color-f2)", userSelect: "none", minWidth: 110,
          transition: "border-color 150ms",
        }}
      >
        {selected.color && <span style={{ width: 7, height: 7, borderRadius: "50%", background: selected.color, flexShrink: 0 }} />}
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected.name}</span>
        {isPending
          ? <IconLoader2 size={10} style={{ color: "var(--color-f4)", animation: "spin 1s linear infinite", flexShrink: 0 }} />
          : <IconChevronDown size={10} style={{ color: "var(--color-f4)", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
        }
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 200,
          width: "max-content", minWidth: "100%",
          background: "var(--color-bg2)", border: "1px solid var(--color-border2)",
          borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", overflow: "hidden",
        }}>
          {options.map(opt => (
            <div
              key={opt.id}
              onClick={() => { onChange(opt.id); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 14px", fontSize: 11, cursor: "pointer",
                whiteSpace: "nowrap",
                background: opt.id === value ? "rgba(34,211,238,0.07)" : "transparent",
                color: opt.id === value ? "var(--color-cyan)" : "var(--color-f2)",
                transition: "background 100ms",
              }}
              onMouseEnter={e => { if (opt.id !== value) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={e => { if (opt.id !== value) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              {opt.color
                ? <span style={{ width: 7, height: 7, borderRadius: "50%", background: opt.color, flexShrink: 0 }} />
                : <span style={{ width: 7, height: 7, flexShrink: 0 }} />
              }
              {opt.name}
              {opt.id === value && <IconCheck size={9} style={{ marginLeft: 12 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Users Tab ── */
type UserRow = { id: string; name: string; email: string | null; createdAt: Date; avatar: string | null; planId: string | null; plan: { id: string; name: string; color: string } | null };

function UsersTab({ users, plans }: { users: UserRow[]; plans: PlanItem[] }) {
  const router = useRouter();
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPw, setNewPw] = useState("");
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  // delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, startDeleting] = useTransition();

  // create user form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "" });
  const [createMsg, setCreateMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [isCreating, startCreating] = useTransition();

  // plan assignment
  const [planChangingId, setPlanChangingId] = useState<string | null>(null);
  const [isPlanPending, startPlanTransition] = useTransition();

  function handlePlanChange(userId: string, planId: string) {
    startPlanTransition(async () => {
      await assignUserToPlan(userId, planId || null);
      setPlanChangingId(null);
      router.refresh();
    });
  }

  function handleReset(userId: string) {
    if (newPw.length < 6) { setMsg({ id: userId, text: "Mínimo 6 caracteres.", ok: false }); return; }
    startTransition(async () => {
      const result = await adminResetPassword(userId, newPw);
      if (result?.error) setMsg({ id: userId, text: result.error, ok: false });
      else { setMsg({ id: userId, text: "Senha alterada.", ok: true }); setResetId(null); setNewPw(""); }
    });
  }

  function handleDelete(userId: string) {
    startDeleting(async () => {
      await adminDeleteUser(userId);
      setConfirmDeleteId(null);
      router.refresh();
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateMsg(null);
    startCreating(async () => {
      const result = await adminCreateUser(createForm);
      if (result?.error) {
        setCreateMsg({ text: result.error, ok: false });
      } else {
        setCreateForm({ name: "", email: "", password: "" });
        setShowCreate(false);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Usuários</div>
        <button
          onClick={() => { setShowCreate(!showCreate); setCreateMsg(null); }}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", fontSize: 11, borderRadius: 6, border: "1px solid var(--color-border2)", background: "var(--color-bg3)", color: "var(--color-cyan)", cursor: "pointer" }}
        >
          <IconUserPlus size={12} /> Criar usuário
        </button>
      </div>
      <div style={{ fontSize: 13, color: "var(--color-f3)", marginBottom: 16 }}>{users.length} cadastrado{users.length !== 1 ? "s" : ""}</div>

      {/* Create user form */}
      {showCreate && (
        <div style={{ background: "var(--color-bg2)", border: "1px solid var(--color-cyan-border)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-cyan)", marginBottom: 12 }}>Novo usuário</div>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              placeholder="Nome"
              value={createForm.name}
              onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
              style={{ height: 36, background: "var(--color-bg3)", border: "1px solid var(--color-border2)", borderRadius: 6, padding: "0 12px", fontSize: 12, color: "var(--color-f1)", outline: "none" }}
            />
            <input
              placeholder="E-mail"
              type="email"
              value={createForm.email}
              onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
              style={{ height: 36, background: "var(--color-bg3)", border: "1px solid var(--color-border2)", borderRadius: 6, padding: "0 12px", fontSize: 12, color: "var(--color-f1)", outline: "none" }}
            />
            <input
              placeholder="Senha (min 6)"
              type="password"
              value={createForm.password}
              onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
              style={{ height: 36, background: "var(--color-bg3)", border: "1px solid var(--color-border2)", borderRadius: 6, padding: "0 12px", fontSize: 12, color: "var(--color-f1)", outline: "none" }}
            />
            {createMsg && (
              <div style={{ fontSize: 11, color: createMsg.ok ? "var(--color-green)" : "var(--color-red)" }}>{createMsg.text}</div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="submit"
                disabled={isCreating}
                style={{ flex: 1, height: 36, background: "var(--color-cyan)", color: "#083344", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                {isCreating ? <IconLoader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : "Criar"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                style={{ height: 36, padding: "0 12px", background: "var(--color-bg4)", color: "var(--color-f3)", border: "1px solid var(--color-border)", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
              >
                <IconX size={12} />
              </button>
            </div>
          </form>
        </div>
      )}

      {users.length === 0 && (
        <div style={{ color: "var(--color-f4)", fontSize: 13 }}>Nenhum usuário cadastrado.</div>
      )}

      {users.map(u => (
        <div key={u.id} style={{ background: "var(--color-bg2)", border: "1px solid var(--color-border)", borderRadius: 10, padding: 16, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: resetId === u.id ? 14 : 0 }}>
            {u.avatar
              ? <img src={u.avatar} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
              : <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--color-bg4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "var(--color-cyan)" }}>{u.name.slice(0,2).toUpperCase()}</div>
            }
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
              <div style={{ fontSize: 11, color: "var(--color-f4)" }}>{u.email ?? "sem e-mail"} · desde {new Date(u.createdAt).toLocaleDateString("pt-BR")}</div>
            </div>

            {/* Plan badge / selector */}
            {planChangingId === u.id ? (
              <PlanDropdown
                plans={plans}
                value={u.planId ?? ""}
                isPending={isPlanPending}
                onChange={planId => handlePlanChange(u.id, planId)}
                onClose={() => setPlanChangingId(null)}
              />
            ) : (
              <button
                onClick={() => { setPlanChangingId(u.id); setResetId(null); setConfirmDeleteId(null); }}
                title="Alterar plano"
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "3px 8px 3px 6px",
                  fontSize: 10, borderRadius: 999, cursor: "pointer",
                  background: u.plan ? `${u.plan.color}18` : "var(--color-bg3)",
                  border: `1px solid ${u.plan ? `${u.plan.color}44` : "var(--color-border)"}`,
                  color: u.plan ? u.plan.color : "var(--color-f4)",
                  transition: "opacity 150ms",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                <IconPackage size={10} />
                {u.plan ? u.plan.name : "Sem plano"}
              </button>
            )}

            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => { setResetId(resetId === u.id ? null : u.id); setNewPw(""); setMsg(null); setConfirmDeleteId(null); setPlanChangingId(null); }}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", fontSize: 11, borderRadius: 6, border: "1px solid var(--color-border2)", background: "var(--color-bg3)", color: "var(--color-f2)", cursor: "pointer" }}
              >
                <IconKey size={12} /> Resetar senha
              </button>
              <button
                onClick={() => { setConfirmDeleteId(confirmDeleteId === u.id ? null : u.id); setResetId(null); setMsg(null); setPlanChangingId(null); }}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", fontSize: 11, borderRadius: 6, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.06)", color: "var(--color-red)", cursor: "pointer" }}
              >
                <IconTrash size={12} /> Excluir
              </button>
            </div>
          </div>

          {/* Delete confirmation */}
          {confirmDeleteId === u.id && (
            <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 8, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.25)" }}>
              <div style={{ fontSize: 12, color: "var(--color-red)", fontWeight: 600, marginBottom: 4 }}>Atenção: ação irreversível</div>
              <div style={{ fontSize: 11, color: "var(--color-f3)", marginBottom: 12 }}>
                Isso vai excluir <strong style={{ color: "var(--color-f1)" }}>{u.name}</strong> e <strong style={{ color: "var(--color-f1)" }}>todos os seus dados</strong> — transações, metas, tags, orçamentos e passivos.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleDelete(u.id)}
                  disabled={isDeleting}
                  style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 14px", background: "var(--color-red)", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                >
                  {isDeleting ? <IconLoader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <IconTrash size={12} />}
                  Confirmar exclusão
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  style={{ height: 32, padding: "0 12px", background: "var(--color-bg4)", color: "var(--color-f3)", border: "1px solid var(--color-border)", borderRadius: 6, fontSize: 11, cursor: "pointer" }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {resetId === u.id && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="password"
                placeholder="Nova senha (min 6)"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                style={{ flex: 1, height: 36, background: "var(--color-bg3)", border: "1px solid var(--color-border2)", borderRadius: 6, padding: "0 12px", fontSize: 12, color: "var(--color-f1)", outline: "none" }}
              />
              <button
                onClick={() => handleReset(u.id)}
                disabled={isPending}
                style={{ height: 36, padding: "0 14px", background: "var(--color-cyan)", color: "#083344", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                {isPending ? "…" : "Salvar"}
              </button>
              <button
                onClick={() => { setResetId(null); setMsg(null); }}
                style={{ height: 36, padding: "0 10px", background: "var(--color-bg4)", color: "var(--color-f3)", border: "1px solid var(--color-border)", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
              >
                <IconX size={12} />
              </button>
            </div>
          )}

          {msg?.id === u.id && (
            <div style={{ marginTop: 8, fontSize: 11, color: msg.ok ? "var(--color-green)" : "var(--color-red)" }}>{msg.text}</div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Plans Tab ── */
const MODULE_GROUPS = Array.from(new Set(ALL_MODULES.map(m => m.group)));

function PlanForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: { name: string; description: string; color: string; isDefault: boolean; modules: string[] };
  onSave: (data: { name: string; description: string; color: string; isDefault: boolean; modules: string[] }) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    color: initial?.color ?? "#22D3EE",
    isDefault: initial?.isDefault ?? false,
    modules: new Set<string>(initial?.modules ?? ALL_MODULES.map(m => m.key)),
  });

  function toggleModule(key: string) {
    setForm(f => {
      const next = new Set(f.modules);
      if (next.has(key)) next.delete(key); else next.add(key);
      return { ...f, modules: next };
    });
  }

  function toggleGroup(group: string) {
    const groupKeys = ALL_MODULES.filter(m => m.group === group).map(m => m.key);
    const allOn = groupKeys.every(k => form.modules.has(k));
    setForm(f => {
      const next = new Set(f.modules);
      groupKeys.forEach(k => allOn ? next.delete(k) : next.add(k));
      return { ...f, modules: next };
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ position: "relative" }}>
          <input
            placeholder="Nome do plano *"
            value={form.name}
            maxLength={20}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            style={{ height: 36, background: "var(--color-bg3)", border: "1px solid var(--color-border2)", borderRadius: 6, padding: "0 44px 0 12px", fontSize: 12, color: "var(--color-f1)", outline: "none", width: "100%" }}
          />
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: form.name.length >= 18 ? "var(--color-red)" : "var(--color-f4)", pointerEvents: "none" }}>
            {form.name.length}/20
          </span>
        </div>
        <input
          placeholder="Descrição (opcional)"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          style={{ height: 36, background: "var(--color-bg3)", border: "1px solid var(--color-border2)", borderRadius: 6, padding: "0 12px", fontSize: 12, color: "var(--color-f1)", outline: "none" }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 11, color: "var(--color-f3)" }}>Cor</label>
          <input
            type="color"
            value={form.color}
            onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
            style={{ width: 32, height: 28, border: "none", background: "none", cursor: "pointer", padding: 0 }}
          />
          <span style={{ fontSize: 11, color: "var(--color-f4)", fontFamily: "monospace" }}>{form.color}</span>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 11, color: "var(--color-f2)", userSelect: "none" }}>
          <div
            onClick={() => setForm(f => ({ ...f, isDefault: !f.isDefault }))}
            style={{
              width: 16, height: 16, borderRadius: 4, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: form.isDefault ? "var(--color-cyan)" : "var(--color-bg3)",
              border: `1.5px solid ${form.isDefault ? "var(--color-cyan)" : "var(--color-border2)"}`,
              transition: "all 150ms",
            }}
          >
            {form.isDefault && <IconCheck size={10} style={{ color: "#083344", strokeWidth: 3 }} />}
          </div>
          Plano padrão (novos usuários)
        </label>
      </div>

      {/* Module checklist */}
      <div style={{ border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "8px 14px", background: "var(--color-bg3)", fontSize: 10, color: "var(--color-f4)", letterSpacing: 1, textTransform: "uppercase", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Módulos ({form.modules.size}/{ALL_MODULES.length})</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setForm(f => ({ ...f, modules: new Set(ALL_MODULES.map(m => m.key)) }))} style={{ fontSize: 10, background: "none", border: "none", color: "var(--color-cyan)", cursor: "pointer" }}>Todos</button>
            <button onClick={() => setForm(f => ({ ...f, modules: new Set() }))} style={{ fontSize: 10, background: "none", border: "none", color: "var(--color-f4)", cursor: "pointer" }}>Nenhum</button>
          </div>
        </div>
        {MODULE_GROUPS.map(group => {
          const groupMods = ALL_MODULES.filter(m => m.group === group);
          const allOn = groupMods.every(m => form.modules.has(m.key));
          return (
            <div key={group} style={{ borderTop: "1px solid var(--color-border)", padding: "10px 14px" }}>
              <button
                onClick={() => toggleGroup(group)}
                style={{ fontSize: 10, color: allOn ? "var(--color-cyan)" : "var(--color-f4)", background: "none", border: "none", cursor: "pointer", marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 }}
              >
                {allOn ? <IconCheck size={10} /> : <span style={{ width: 10, height: 10, border: "1px solid currentColor", borderRadius: 2, display: "inline-block" }} />}
                {group}
              </button>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {groupMods.map(m => {
                  const on = form.modules.has(m.key);
                  return (
                    <button
                      key={m.key}
                      onClick={() => toggleModule(m.key)}
                      style={{
                        display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                        fontSize: 11, borderRadius: 999, cursor: "pointer", transition: "all 100ms",
                        background: on ? "rgba(34,211,238,0.12)" : "var(--color-bg3)",
                        border: `1px solid ${on ? "rgba(34,211,238,0.4)" : "var(--color-border)"}`,
                        color: on ? "var(--color-cyan)" : "var(--color-f4)",
                      }}
                    >
                      {on && <IconCheck size={9} />}
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => onSave({ name: form.name, description: form.description, color: form.color, isDefault: form.isDefault, modules: Array.from(form.modules) })}
          disabled={isSaving || !form.name.trim()}
          style={{ flex: 1, height: 36, background: "var(--color-cyan)", color: "#083344", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          {isSaving ? <IconLoader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <IconCheck size={13} />}
          Salvar
        </button>
        <button
          onClick={onCancel}
          style={{ height: 36, padding: "0 14px", background: "var(--color-bg4)", color: "var(--color-f3)", border: "1px solid var(--color-border)", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function PlansTab({ plans, users }: { plans: PlanItem[]; users: { id: string; name: string }[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [migrateTarget, setMigrateTarget] = useState<string>(""); // planId to migrate to
  const [formMsg, setFormMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isSeeding, startSeeding] = useTransition();
  const [isSeedingInsider, startSeedingInsider] = useTransition();

  function handleCreate(data: { name: string; description: string; color: string; isDefault: boolean; modules: string[] }) {
    setFormMsg(null);
    startSaving(async () => {
      const r = await createPlan(data);
      if (r.error) { setFormMsg({ text: r.error, ok: false }); return; }
      setShowCreate(false);
      router.refresh();
    });
  }

  function handleUpdate(id: string, data: { name: string; description: string; color: string; isDefault: boolean; modules: string[] }) {
    setFormMsg(null);
    startSaving(async () => {
      const r = await updatePlan(id, data);
      if (r.error) { setFormMsg({ text: r.error, ok: false }); return; }
      setEditId(null);
      router.refresh();
    });
  }

  function openDeleteConfirm(planId: string) {
    setConfirmDeleteId(planId);
    setEditId(null);
    setFormMsg(null);
    // Pre-select first other plan as migration target
    const other = plans.find(p => p.id !== planId);
    setMigrateTarget(other?.id ?? "");
  }

  function handleDelete(plan: PlanItem) {
    startDeleting(async () => {
      if (plan.userCount > 0) {
        const r = await migrateAndDeletePlan(plan.id, migrateTarget || null);
        if (r.error) { setFormMsg({ text: r.error, ok: false }); return; }
        setFormMsg({ text: `${r.moved} usuário(s) migrado(s) com sucesso.`, ok: true });
      } else {
        const r = await deletePlan(plan.id);
        if (r.error) { setFormMsg({ text: r.error, ok: false }); return; }
      }
      setConfirmDeleteId(null);
      router.refresh();
    });
  }

  function handleSeed() {
    startSeeding(async () => {
      await ensureDefaultPlan();
      router.refresh();
    });
  }

  function handleSeedInsider() {
    startSeedingInsider(async () => {
      const r = await ensureInsiderPlan();
      if (r.error) setFormMsg({ text: r.error, ok: false });
      else if (!r.created) setFormMsg({ text: "Plano Insider já existe.", ok: true });
      router.refresh();
    });
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Planos de acesso</div>
        <div style={{ display: "flex", gap: 8 }}>
          {plans.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", fontSize: 11, borderRadius: 6, border: "1px solid var(--color-cyan-border)", background: "rgba(34,211,238,0.07)", color: "var(--color-cyan)", cursor: "pointer" }}
            >
              {isSeeding ? <IconLoader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <IconPackage size={12} />}
              Criar plano Full
            </button>
          )}
          {!plans.some(p => p.name === "Insider") && (
            <button
              onClick={handleSeedInsider}
              disabled={isSeedingInsider}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", fontSize: 11, borderRadius: 6, border: "1px solid rgba(167,139,250,0.4)", background: "rgba(167,139,250,0.07)", color: "#A78BFA", cursor: "pointer" }}
            >
              {isSeedingInsider ? <IconLoader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <IconStar size={12} />}
              Criar plano Insider
            </button>
          )}
          <button
            onClick={() => { setShowCreate(!showCreate); setFormMsg(null); setEditId(null); }}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", fontSize: 11, borderRadius: 6, border: "1px solid var(--color-border2)", background: "var(--color-bg3)", color: "var(--color-cyan)", cursor: "pointer" }}
          >
            <IconPlus size={12} /> Novo plano
          </button>
        </div>
      </div>
      <div style={{ fontSize: 13, color: "var(--color-f3)", marginBottom: 16 }}>{plans.length} plano{plans.length !== 1 ? "s" : ""} configurado{plans.length !== 1 ? "s" : ""}</div>

      {formMsg && (
        <div style={{ marginBottom: 12, fontSize: 12, padding: "8px 12px", borderRadius: 6, background: formMsg.ok ? "rgba(163,230,53,0.08)" : "rgba(248,113,113,0.08)", border: `1px solid ${formMsg.ok ? "rgba(163,230,53,0.3)" : "rgba(248,113,113,0.3)"}`, color: formMsg.ok ? "var(--color-green)" : "var(--color-red)" }}>
          {formMsg.text}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div style={{ background: "var(--color-bg2)", border: "1px solid var(--color-cyan-border)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-cyan)", marginBottom: 12 }}>Novo plano</div>
          <PlanForm onSave={handleCreate} onCancel={() => setShowCreate(false)} isSaving={isSaving} />
        </div>
      )}

      {plans.length === 0 && !showCreate && (
        <div style={{ color: "var(--color-f4)", fontSize: 13 }}>Nenhum plano criado ainda. Clique em "Criar plano Full" para começar.</div>
      )}

      {plans.map(plan => (
        <div key={plan.id} style={{ background: "var(--color-bg2)", border: `1px solid ${editId === plan.id ? plan.color + "44" : "var(--color-border)"}`, borderRadius: 10, padding: 16, marginBottom: 10, transition: "border-color 200ms" }}>
          {editId === plan.id ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-cyan)", marginBottom: 12 }}>Editar plano</div>
              <PlanForm
                initial={{ name: plan.name, description: plan.description ?? "", color: plan.color, isDefault: plan.isDefault, modules: plan.modules }}
                onSave={data => handleUpdate(plan.id, data)}
                onCancel={() => setEditId(null)}
                isSaving={isSaving}
              />
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: plan.color, flexShrink: 0, marginTop: 3 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-f1)" }}>{plan.name}</span>
                    {plan.isDefault && (
                      <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 999, background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.3)", color: "var(--color-cyan)", letterSpacing: 0.5, textTransform: "uppercase" }}>padrão</span>
                    )}
                    <span style={{ fontSize: 11, color: "var(--color-f4)" }}>{plan.userCount} usuário{plan.userCount !== 1 ? "s" : ""}</span>
                  </div>
                  {plan.description && <div style={{ fontSize: 12, color: "var(--color-f3)", marginBottom: 8 }}>{plan.description}</div>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                    {MODULE_GROUPS.map(group => {
                      const groupMods = ALL_MODULES.filter(m => m.group === group && plan.modules.includes(m.key));
                      if (groupMods.length === 0) return null;
                      return (
                        <div key={group} style={{ display: "flex", flexWrap: "wrap", gap: 3, alignItems: "center" }}>
                          <span style={{ fontSize: 9, color: "var(--color-f4)", marginRight: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{group}:</span>
                          {groupMods.map(m => (
                            <span key={m.key} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: `${plan.color}14`, border: `1px solid ${plan.color}33`, color: plan.color }}>{m.label}</span>
                          ))}
                        </div>
                      );
                    })}
                    <span style={{ fontSize: 10, color: "var(--color-f4)", alignSelf: "center" }}>({plan.modules.length}/{ALL_MODULES.length} módulos)</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => { setEditId(plan.id); setConfirmDeleteId(null); setFormMsg(null); }}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", fontSize: 11, borderRadius: 6, border: "1px solid var(--color-border2)", background: "var(--color-bg3)", color: "var(--color-f2)", cursor: "pointer" }}
                  >
                    <IconEdit size={12} /> Editar
                  </button>
                  <button
                    onClick={() => confirmDeleteId === plan.id ? setConfirmDeleteId(null) : openDeleteConfirm(plan.id)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", fontSize: 11, borderRadius: 6, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.06)", color: "var(--color-red)", cursor: "pointer" }}
                  >
                    <IconTrash size={12} /> Excluir
                  </button>
                </div>
              </div>

              {/* Delete / migrate confirmation */}
              {confirmDeleteId === plan.id && (
                <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 8, background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.25)" }}>
                  <div style={{ fontSize: 12, color: "var(--color-red)", fontWeight: 600, marginBottom: 6 }}>
                    Excluir "{plan.name}"
                    {plan.userCount > 0 && ` · ${plan.userCount} usuário${plan.userCount !== 1 ? "s" : ""} serão migrados`}
                  </div>

                  {plan.userCount > 0 ? (
                    <>
                      <div style={{ fontSize: 11, color: "var(--color-f3)", marginBottom: 10 }}>
                        Escolha para qual plano mover os usuários antes de excluir:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                        {plans.filter(p => p.id !== plan.id).map(p => (
                          <button
                            key={p.id}
                            onClick={() => setMigrateTarget(p.id)}
                            style={{
                              display: "flex", alignItems: "center", gap: 6,
                              padding: "5px 12px", fontSize: 11, borderRadius: 999, cursor: "pointer",
                              background: migrateTarget === p.id ? `${p.color}18` : "var(--color-bg3)",
                              border: `1px solid ${migrateTarget === p.id ? p.color + "66" : "var(--color-border)"}`,
                              color: migrateTarget === p.id ? p.color : "var(--color-f3)",
                              transition: "all 150ms",
                            }}
                          >
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color }} />
                            {p.name}
                            {migrateTarget === p.id && <IconCheck size={9} />}
                          </button>
                        ))}
                        <button
                          onClick={() => setMigrateTarget("")}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "5px 12px", fontSize: 11, borderRadius: 999, cursor: "pointer",
                            background: migrateTarget === "" ? "rgba(248,113,113,0.1)" : "var(--color-bg3)",
                            border: `1px solid ${migrateTarget === "" ? "rgba(248,113,113,0.4)" : "var(--color-border)"}`,
                            color: migrateTarget === "" ? "var(--color-red)" : "var(--color-f3)",
                            transition: "all 150ms",
                          }}
                        >
                          Sem plano
                          {migrateTarget === "" && <IconCheck size={9} />}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: "var(--color-f3)", marginBottom: 14 }}>
                      Nenhum usuário neste plano. A exclusão é segura.
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleDelete(plan)}
                      disabled={isDeleting}
                      style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 14px", background: "var(--color-red)", color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                    >
                      {isDeleting ? <IconLoader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <IconTrash size={12} />}
                      {plan.userCount > 0 ? "Migrar e excluir" : "Excluir"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      style={{ height: 32, padding: "0 12px", background: "var(--color-bg4)", color: "var(--color-f3)", border: "1px solid var(--color-border)", borderRadius: 6, fontSize: 11, cursor: "pointer" }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Docs Tab ── */
function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
}

function DocsTab({ content }: { content: string }) {
  const headings = content
    .split("\n")
    .filter(l => /^#{2,4} /.test(l))
    .map(l => {
      const level = l.match(/^(#{2,4}) /)?.[1].length ?? 2;
      const text = l.replace(/^#{2,4} /, "");
      return { level, text };
    });

  const indentMap: Record<number, string> = { 2: "8px", 3: "20px", 4: "32px" };
  const sizeMap:   Record<number, string> = { 2: "12px", 3: "11px", 4: "10px" };
  const colorMap:  Record<number, string> = {
    2: "var(--color-f2)",
    3: "var(--color-f4)",
    4: "var(--color-f4)",
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 101px)" }}>
      {/* TOC sidebar */}
      <div style={{
        width: 220,
        flexShrink: 0,
        borderRight: "1px solid var(--color-border)",
        overflowY: "auto",
        padding: "20px 12px",
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 10, padding: "0 8px" }}>
          Índice
        </div>
        {headings.map(({ level, text }, i) => (
          <button
            key={i}
            onClick={() => document.getElementById(slugify(text))?.scrollIntoView({ behavior: "smooth", block: "start" })}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: `4px 8px 4px ${indentMap[level]}`,
              fontSize: sizeMap[level],
              color: colorMap[level],
              background: "none",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              lineHeight: 1.4,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            {text}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 48px" }}>
        <style>{`
          .md-body h1 { font-size: 28px; font-weight: 700; font-style: italic; font-family: var(--font-display); color: var(--color-f1); margin: 0 0 8px; line-height: 1.2; }
          .md-body h2 { font-size: 18px; font-weight: 600; color: var(--color-f1); margin: 36px 0 12px; padding-bottom: 8px; border-bottom: 1px solid var(--color-border); }
          .md-body h3 { font-size: 14px; font-weight: 600; color: var(--color-cyan); margin: 24px 0 8px; }
          .md-body h4 { font-size: 12px; font-weight: 600; color: var(--color-f2); margin: 16px 0 6px; text-transform: uppercase; letter-spacing: 1px; }
          .md-body p { font-size: 13px; color: var(--color-f2); line-height: 1.7; margin: 0 0 12px; }
          .md-body ul, .md-body ol { margin: 0 0 12px; padding-left: 20px; }
          .md-body li { font-size: 13px; color: var(--color-f2); line-height: 1.7; margin-bottom: 3px; }
          .md-body code { font-family: monospace; font-size: 11.5px; background: var(--color-bg3); border: 1px solid var(--color-border); border-radius: 4px; padding: 1px 5px; color: var(--color-cyan); }
          .md-body pre { background: var(--color-bg3); border: 1px solid var(--color-border); border-radius: 10px; padding: 16px; overflow-x: auto; margin: 0 0 16px; }
          .md-body pre code { background: none; border: none; padding: 0; font-size: 12px; color: var(--color-f2); }
          .md-body hr { border: none; border-top: 1px solid var(--color-border); margin: 28px 0; }
          .md-body table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 0 0 16px; }
          .md-body thead tr { background: var(--color-bg3); }
          .md-body th { padding: 8px 12px; text-align: left; color: var(--color-f4); font-weight: 500; border-bottom: 1px solid var(--color-border); }
          .md-body td { padding: 7px 12px; color: var(--color-f2); border-bottom: 1px solid var(--color-border); }
          .md-body tbody tr:hover { background: rgba(255,255,255,0.02); }
          .md-body strong { color: var(--color-f1); font-weight: 600; }
          .md-body blockquote { border-left: 3px solid var(--color-cyan-border); padding-left: 14px; margin: 0 0 12px; color: var(--color-f3); font-style: italic; }
          .md-body a { color: var(--color-cyan); text-decoration: none; }
          .md-body a:hover { text-decoration: underline; }
        `}</style>

        <div className="md-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => <h2 id={slugify(String(children))}>{children}</h2>,
              h3: ({ children }) => <h3 id={slugify(String(children))}>{children}</h3>,
              h4: ({ children }) => <h4 id={slugify(String(children))}>{children}</h4>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

/* ── Modules Tab ── */
function ModulesTab({ data, appConfig }: { data: StudioData; appConfig: AppConfigEntry[] }) {
  const router = useRouter();
  const groups = Array.from(new Set(ALL_MODULES.map(m => m.group)));

  // Runtime beta list from AppConfig (falls back to static isBeta)
  const [betaKeys, setBetaKeys] = useState<string[]>(() => {
    const raw = appConfig.find(c => c.key === "betaModules")?.value ?? "";
    if (!raw) return ALL_MODULES.filter(m => m.isBeta).map(m => m.key);
    try { return JSON.parse(raw); } catch { return ALL_MODULES.filter(m => m.isBeta).map(m => m.key); }
  });
  const [savingKey, setSavingKey] = useState<string | null>(null);

  function plansWithModule(key: string) {
    return data.plans.filter(p => p.modules.includes(key)).length;
  }
  function usersWithAccess(key: string) {
    return data.users.filter(u => {
      if (!u.planId) return true;
      const plan = data.plans.find(p => p.id === u.planId);
      return plan?.modules.includes(key) ?? false;
    }).length;
  }

  async function toggleBeta(key: string) {
    const next = betaKeys.includes(key) ? betaKeys.filter(k => k !== key) : [...betaKeys, key];
    setBetaKeys(next);
    setSavingKey(key);
    await setAppConfig("betaModules", JSON.stringify(next));
    setSavingKey(null);
    router.refresh();
  }

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Módulos</div>
      <div style={{ fontSize: 13, color: "var(--color-f3)", marginBottom: 20 }}>
        {ALL_MODULES.length} módulos · {betaKeys.length} em beta · clique no badge para alternar
      </div>

      {groups.map(group => {
        const mods = ALL_MODULES.filter(m => m.group === group);
        return (
          <div key={group} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 10 }}>
              {group}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
              {mods.map(m => {
                const isBeta = betaKeys.includes(m.key);
                const withAccess = usersWithAccess(m.key);
                const inPlans = plansWithModule(m.key);
                return (
                  <div key={m.key} style={{ background: "var(--color-bg2)", border: `1px solid ${isBeta ? "rgba(251,191,36,0.2)" : "var(--color-border)"}`, borderRadius: 10, padding: "12px 14px", transition: "border-color 200ms" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-f1)", flex: 1 }}>{m.label}</span>
                      <button
                        onClick={() => toggleBeta(m.key)}
                        disabled={savingKey === m.key}
                        title={isBeta ? "Clique para remover Beta" : "Clique para marcar como Beta"}
                        style={{
                          fontSize: 9, padding: "1px 6px", borderRadius: 999, cursor: "pointer",
                          background: isBeta ? "rgba(251,191,36,0.12)" : "var(--color-bg3)",
                          border: `1px solid ${isBeta ? "rgba(251,191,36,0.4)" : "var(--color-border)"}`,
                          color: isBeta ? "#FBBF24" : "var(--color-f4)",
                          fontWeight: 700, letterSpacing: 0.3,
                          transition: "all 150ms",
                          display: "flex", alignItems: "center", gap: 3,
                        }}
                      >
                        {savingKey === m.key
                          ? <IconLoader2 size={9} style={{ animation: "spin 1s linear infinite" }} />
                          : null
                        }
                        {isBeta ? "Beta" : "+ Beta"}
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-f4)", marginBottom: 10, lineHeight: 1.55 }}>{m.summary}</div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <span style={{ fontSize: 10, color: inPlans > 0 ? "var(--color-f3)" : "var(--color-f4)" }}>
                        {inPlans}/{data.plans.length} planos
                      </span>
                      <span style={{ fontSize: 10, color: withAccess > 0 ? "var(--color-cyan)" : "var(--color-f4)" }}>
                        {withAccess}/{data.users.length} usuários
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Half-circle gauge ── */
function Gauge({ pct, color, label, sub }: { pct: number; color: string; label: string; sub: string }) {
  const r = 38;
  const cx = 50, cy = 52;
  const circ = Math.PI * r; // half-circle arc length
  const filled = Math.max(0, Math.min(1, pct)) * circ;
  const dimColor = `${color}22`;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox="0 0 100 62" style={{ width: "100%", maxWidth: 140, overflow: "visible" }}>
        {/* Track */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={dimColor} strokeWidth={9} strokeLinecap="round" />
        {/* Progress */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={color} strokeWidth={9} strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          style={{ filter: `drop-shadow(0 0 4px ${color}66)` }}
        />
        {/* Percentage */}
        <text x={cx} y={cy - 6} textAnchor="middle" fill={color}
          style={{ fontSize: 15, fontWeight: 700, fontStyle: "italic", fontFamily: "var(--font-display)" }}>
          {Math.round(pct * 100)}%
        </text>
        {/* Sub-label */}
        <text x={cx} y={cy + 8} textAnchor="middle" fill="rgba(255,255,255,0.3)" style={{ fontSize: 7 }}>
          {sub}
        </text>
      </svg>
      <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-f2)", marginTop: -4 }}>{label}</div>
    </div>
  );
}

/* ── Control Panel Tab ── */
function ControlPanelTab({ appConfig, data }: { appConfig: AppConfigEntry[]; data: StudioData }) {
  const router = useRouter();
  const [savingKey, setSavingKey]   = useState<string | null>(null);
  const [msgs, setMsgs]             = useState<Record<string, { ok: boolean; text: string }>>({});
  const [banner, setBanner]         = useState(appConfig.find(c => c.key === "maintenanceBanner")?.value ?? "");
  // CS-32: rate limiting
  const [captchaThreshold, setCaptchaThreshold] = useState(appConfig.find(c => c.key === "login_captcha_threshold")?.value ?? "10");
  const [blockThreshold,   setBlockThreshold]   = useState(appConfig.find(c => c.key === "login_block_threshold")?.value   ?? "15");
  const [windowMinutes,    setWindowMinutes]     = useState(appConfig.find(c => c.key === "login_window_minutes")?.value    ?? "30");
  const [metrics, setMetrics]       = useState<ServerMetrics | null>(null);
  const [, startMetrics]            = useTransition();

  useEffect(() => {
    startMetrics(async () => { setMetrics(await getServerMetrics()); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function getValue(key: string) { return appConfig.find(c => c.key === key)?.value ?? ""; }
  const allowUserCreation = getValue("allowUserCreation") === "true";
  const maintenanceMode   = getValue("maintenanceMode")   === "true";

  async function save(key: string, value: string) {
    setSavingKey(key);
    const r = await setAppConfig(key, value);
    setSavingKey(null);
    setMsgs(m => ({ ...m, [key]: { ok: r.ok, text: r.ok ? "Salvo." : "Erro ao salvar." } }));
    setTimeout(() => setMsgs(m => { const next = { ...m }; delete next[key]; return next; }), 2500);
    router.refresh();
  }

  function Toggle({ on, loading, onToggle }: { on: boolean; loading: boolean; onToggle: () => void }) {
    return (
      <button onClick={onToggle} disabled={loading}
        style={{
          width: 44, height: 24, borderRadius: 999, border: "none", cursor: loading ? "wait" : "pointer",
          background: on ? "var(--color-cyan)" : "var(--color-bg4)",
          position: "relative", transition: "background 200ms", flexShrink: 0,
          boxShadow: on ? "0 0 0 2px rgba(34,211,238,0.25)" : "0 0 0 1px var(--color-border2)",
          display: "flex", alignItems: "center",
        }}
      >
        <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", left: on ? "calc(100% - 21px)" : 3, transition: "left 200ms", display: "block", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
        {loading && <IconLoader2 size={10} style={{ position: "absolute", right: -18, color: "var(--color-f4)", animation: "spin 1s linear infinite" }} />}
      </button>
    );
  }

  // Helpers
  function fmtBytes(b: number) {
    if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(1)} GB`;
    if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(0)} MB`;
    return `${(b / 1024).toFixed(0)} KB`;
  }
  function fmtUptime(s: number) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }
  function gaugeColor(pct: number, low = "#A3E635", mid = "#FBBF24", high = "#F87171") {
    return pct > 0.85 ? high : pct > 0.65 ? mid : low;
  }
  function dbSize(b: number) {
    if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(2)} GB`;
    if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(2)} MB`;
    if (b >= 1024)      return `${(b / 1024).toFixed(1)} KB`;
    return b ? `${b} B` : "—";
  }

  const ramPct  = metrics ? metrics.memUsedBytes  / metrics.memTotalBytes  : 0;
  const heapPct = metrics ? metrics.heapUsedBytes / metrics.heapTotalBytes : 0;
  const cpuPct  = metrics ? Math.min(1, metrics.loadAvg1m / metrics.cpuCount) : 0;

  const sectionLabel = (text: string) => (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 14 }}>{text}</div>
  );

  const miniCard = (label: string, value: string | number, color: string, sub: string) => (
    <div key={label} style={{ background: "var(--color-bg3)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 18, fontWeight: 700, fontStyle: "italic", fontFamily: "var(--font-display)", color, marginBottom: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--color-f2)", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 10, color: "var(--color-f4)", marginTop: 1 }}>{sub}</div>
    </div>
  );

  const toggleRows = [
    { key: "allowUserCreation", label: "Permitir criação de contas",  description: "Se desativado, o formulário de cadastro fica inacessível.",    on: allowUserCreation },
    { key: "maintenanceMode",   label: "Modo manutenção",             description: "Exibe um banner de aviso para todos os usuários autenticados.", on: maintenanceMode   },
  ];

  return (
    <div style={{ padding: 28, maxWidth: 1200 }}>

      {/* ── Two-column dashboard ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 36, alignItems: "start" }}>

        {/* ── Coluna esquerda: Sistema ── */}
        <div>
          {sectionLabel("Sistema")}
          {/* Row 1: usuários + planos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            {miniCard("Usuários", data.userCount, "#22D3EE", "contas ativas")}
            {miniCard("Planos ativos", data.plans.length, "#34D399", "planos configurados")}
          </div>
          {/* Row 2: registros totais */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ background: "var(--color-bg3)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 18, fontWeight: 700, fontStyle: "italic", fontFamily: "var(--font-display)", color: "#A78BFA", marginBottom: 1 }}>{data.totalRecords.toLocaleString("pt-BR")}</div>
              <div style={{ fontSize: 11, color: "var(--color-f2)", fontWeight: 500 }}>Total de registros</div>
              <div style={{ fontSize: 10, color: "var(--color-f4)", marginTop: 1 }}>em todas as tabelas</div>
            </div>
          </div>
        </div>

        {/* ── Coluna direita: Servidor ── */}
        <div>
          <div style={{ position: "relative" }}>
            {sectionLabel("Servidor")}
            <button type="button"
              onClick={() => startMetrics(async () => { setMetrics(await getServerMetrics()); })}
              style={{ position: "absolute", top: 0, right: 0, display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--color-f4)", background: "none", border: "none", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-f2)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-f4)")}
            >
              <IconLoader2 size={11} />Atualizar
            </button>
          </div>

          {!metrics ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-f4)", fontSize: 12, paddingTop: 20 }}>
              <IconLoader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              Coletando métricas…
            </div>
          ) : (
            <>
              {/* Gauges */}
              <div style={{ background: "var(--color-bg2)", border: "1px solid var(--color-border)", borderRadius: 12, padding: "18px 12px 12px", marginBottom: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <Gauge pct={ramPct}  color={gaugeColor(ramPct)}           label="RAM" sub={`${fmtBytes(metrics.memUsedBytes)} / ${fmtBytes(metrics.memTotalBytes)}`} />
                  <Gauge pct={heapPct} color={gaugeColor(heapPct, "#60A5FA", "#FBBF24", "#F87171")} label="Heap Node.js" sub={`${fmtBytes(metrics.heapUsedBytes)} / ${fmtBytes(metrics.heapTotalBytes)}`} />
                  <Gauge pct={cpuPct}  color={gaugeColor(cpuPct, "#A78BFA", "#FBBF24", "#F87171")} label={`CPU load`} sub={`${metrics.loadAvg1m.toFixed(2)} · ${metrics.cpuCount} núcleos`} />
                </div>
              </div>

              {/* Version cards — dev + prod */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                {/* Dev */}
                <div style={{ background: "var(--color-bg3)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, fontStyle: "italic", fontFamily: "var(--font-display)", color: "#60A5FA" }}>v{data.appVersion}</span>
                    <span style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(96,165,250,0.6)", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 4, padding: "1px 5px" }}>{data.devCommit}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-f2)", fontWeight: 500 }}>Branch dev</div>
                  <div style={{ fontSize: 10, color: "var(--color-f4)", marginTop: 1, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.devBranch}</div>
                </div>
                {/* Prod */}
                <div style={{ background: "var(--color-bg3)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, fontStyle: "italic", fontFamily: "var(--font-display)", color: "#A3E635" }}>v{data.prodVersion}</span>
                    <span style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(163,230,53,0.6)", background: "rgba(163,230,53,0.08)", border: "1px solid rgba(163,230,53,0.2)", borderRadius: 4, padding: "1px 5px" }}>{data.prodCommit}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-f2)", fontWeight: 500 }}>Branch prod</div>
                  <div style={{ fontSize: 10, color: "var(--color-f4)", marginTop: 1, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.prodBranch}</div>
                </div>
              </div>

              {/* Small info cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {miniCard("Banco",        dbSize(data.dbSizeBytes),    "#FB923C", "PostgreSQL")}
                {miniCard("Uptime",       fmtUptime(metrics.uptimeSeconds), "#A78BFA", "processo Node")}
                {miniCard("Online agora", metrics.onlineNow,           metrics.onlineNow > 0 ? "#A3E635" : "var(--color-f4)", "últimos 5 min")}
                {miniCard("Ativos hoje",  metrics.activeToday,         "#22D3EE", "desde meia-noite")}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Configurações ── */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 12 }}>Configurações</div>

      {toggleRows.map(row => (
        <div key={row.key} style={{ background: "var(--color-bg2)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{row.label}</div>
              <div style={{ fontSize: 11, color: "var(--color-f4)" }}>{row.description}</div>
            </div>
            <Toggle on={row.on} loading={savingKey === row.key} onToggle={() => save(row.key, String(!row.on))} />
          </div>
          {msgs[row.key] && <div style={{ marginTop: 8, fontSize: 11, color: msgs[row.key].ok ? "var(--color-green)" : "var(--color-red)" }}>{msgs[row.key].text}</div>}
        </div>
      ))}

      {/* Banner text */}
      <div style={{ background: "var(--color-bg2)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Mensagem do banner de manutenção</div>
        <div style={{ fontSize: 11, color: "var(--color-f4)", marginBottom: 10 }}>Texto exibido no banner amarelo quando o modo manutenção está ativo.</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={banner} onChange={e => setBanner(e.target.value)}
            style={{ flex: 1, height: 36, background: "var(--color-bg3)", border: "1px solid var(--color-border2)", borderRadius: 6, padding: "0 12px", fontSize: 12, color: "var(--color-f1)", outline: "none" }} />
          <button onClick={() => save("maintenanceBanner", banner)} disabled={savingKey === "maintenanceBanner"}
            style={{ height: 36, padding: "0 16px", background: "var(--color-cyan)", color: "#083344", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            {savingKey === "maintenanceBanner" ? <IconLoader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <IconCheck size={13} />}
            Salvar
          </button>
        </div>
        {msgs["maintenanceBanner"] && <div style={{ marginTop: 8, fontSize: 11, color: msgs["maintenanceBanner"].ok ? "var(--color-green)" : "var(--color-red)" }}>{msgs["maintenanceBanner"].text}</div>}
      </div>

      {/* ── CS-32: Rate Limiting ── */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase", color: "var(--color-f4)", margin: "28px 0 12px" }}>Segurança — Rate Limiting</div>

      {[
        {
          key: "login_captcha_threshold",
          label: "Tentativas antes do CAPTCHA",
          description: "Número de falhas de login por IP antes de exigir o desafio Cloudflare Turnstile.",
          value: captchaThreshold,
          setValue: setCaptchaThreshold,
          min: 1, max: 50, placeholder: "10",
        },
        {
          key: "login_block_threshold",
          label: "Tentativas antes do bloqueio",
          description: "Número de falhas para bloquear temporariamente o IP. Deve ser maior que o threshold do CAPTCHA.",
          value: blockThreshold,
          setValue: setBlockThreshold,
          min: 1, max: 100, placeholder: "15",
        },
        {
          key: "login_window_minutes",
          label: "Janela de tempo (minutos)",
          description: "Período de contagem das tentativas. Após este tempo, as tentativas antigas saem da janela e o IP é desbloqueado automaticamente.",
          value: windowMinutes,
          setValue: setWindowMinutes,
          min: 1, max: 1440, placeholder: "30",
        },
      ].map(row => (
        <div key={row.key} style={{ background: "var(--color-bg2)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{row.label}</div>
          <div style={{ fontSize: 11, color: "var(--color-f4)", marginBottom: 10 }}>{row.description}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="number"
              min={row.min}
              max={row.max}
              value={row.value}
              onChange={e => row.setValue(e.target.value)}
              placeholder={row.placeholder}
              style={{ width: 80, height: 36, background: "var(--color-bg3)", border: "1px solid var(--color-border2)", borderRadius: 6, padding: "0 12px", fontSize: 13, fontWeight: 600, color: "var(--color-cyan)", outline: "none", textAlign: "center" }}
            />
            <button
              onClick={() => save(row.key, row.value)}
              disabled={savingKey === row.key}
              style={{ height: 36, padding: "0 16px", background: "var(--color-cyan)", color: "#083344", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}
            >
              {savingKey === row.key ? <IconLoader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <IconCheck size={13} />}
              Salvar
            </button>
          </div>
          {msgs[row.key] && <div style={{ marginTop: 8, fontSize: 11, color: msgs[row.key].ok ? "var(--color-green)" : "var(--color-red)" }}>{msgs[row.key].text}</div>}
        </div>
      ))}
    </div>
  );
}

/* ── Notes Tab ── */
const SLASH_COMMANDS = [
  { id: "h1",      label: "Título 1",             icon: "H1",  prefix: "# ",       suffix: "" },
  { id: "h2",      label: "Título 2",             icon: "H2",  prefix: "## ",      suffix: "" },
  { id: "h3",      label: "Título 3",             icon: "H3",  prefix: "### ",     suffix: "" },
  { id: "bullet",  label: "Lista com marcadores", icon: "•",   prefix: "- ",       suffix: "" },
  { id: "numbered",label: "Lista numerada",       icon: "1.",  prefix: "1. ",      suffix: "" },
  { id: "task",    label: "Lista de tarefas",     icon: "☐",   prefix: "- [ ] ",   suffix: "" },
  { id: "code",    label: "Bloco de código",      icon: "</>", prefix: "```\n",    suffix: "\n```" },
  { id: "quote",   label: "Citação",              icon: "❝",   prefix: "> ",       suffix: "" },
  { id: "divider", label: "Divisor",              icon: "—",   prefix: "\n---\n",  suffix: "" },
  { id: "bold",    label: "Negrito",              icon: "B",   prefix: "**",       suffix: "**" },
  { id: "italic",  label: "Itálico",              icon: "I",   prefix: "*",        suffix: "*" },
];

function NotesTab({ appConfig }: { appConfig: AppConfigEntry[] }) {
  const [content, setContent] = useState(appConfig.find(c => c.key === "adminNotes")?.value ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved]       = useState(false);
  const [slashMenu, setSlashMenu] = useState<{ filter: string; lineStart: number } | null>(null);
  const [slashSel, setSlashSel]   = useState(0);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);

  const filteredCmds = slashMenu
    ? SLASH_COMMANDS.filter(c =>
        c.label.toLowerCase().includes(slashMenu.filter) ||
        c.id.includes(slashMenu.filter))
    : [];

  function debounceSave(v: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSaving(true);
      await saveAdminNotes(v);
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 2000);
  }

  function commit(newVal: string, newCursor?: number) {
    setContent(newVal);
    setSaved(false);
    debounceSave(newVal);
    if (newCursor !== undefined) {
      setTimeout(() => {
        textareaRef.current?.setSelectionRange(newCursor, newCursor);
        textareaRef.current?.focus();
      }, 0);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v   = e.target.value;
    const pos = e.target.selectionStart;
    setContent(v);
    setSaved(false);
    debounceSave(v);

    // Slash detection
    const before      = v.substring(0, pos);
    const lineStart   = before.lastIndexOf("\n") + 1;
    const currentLine = before.substring(lineStart);
    if (currentLine.startsWith("/")) {
      setSlashMenu({ filter: currentLine.substring(1).toLowerCase(), lineStart });
      setSlashSel(0);
    } else {
      setSlashMenu(null);
    }
  }

  function applyInline(before: string, after = "") {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = content.substring(s, e);
    const next = content.substring(0, s) + before + sel + after + content.substring(e);
    commit(next, s + before.length + sel.length);
    setSlashMenu(null);
  }

  function applyLine(prefix: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const s         = ta.selectionStart;
    const lineStart = content.lastIndexOf("\n", s - 1) + 1;
    const next      = content.substring(0, lineStart) + prefix + content.substring(lineStart);
    commit(next, s + prefix.length);
    setSlashMenu(null);
  }

  function applySlash(cmd: typeof SLASH_COMMANDS[number]) {
    const ta = textareaRef.current;
    if (!ta || !slashMenu) return;
    const cursor = ta.selectionStart;
    const next   = content.substring(0, slashMenu.lineStart) + cmd.prefix + cmd.suffix + content.substring(cursor);
    commit(next, slashMenu.lineStart + cmd.prefix.length);
    setSlashMenu(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b") { e.preventDefault(); applyInline("**", "**"); return; }
      if (e.key === "i") { e.preventDefault(); applyInline("*",  "*");  return; }
      if (e.key === "k") { e.preventDefault(); applyInline("`",  "`");  return; }
    }
    // Slash menu navigation
    if (slashMenu && filteredCmds.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSlashSel(s => Math.min(s + 1, filteredCmds.length - 1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSlashSel(s => Math.max(s - 1, 0)); return; }
      if (e.key === "Enter")     { e.preventDefault(); applySlash(filteredCmds[slashSel]); return; }
      if (e.key === "Escape")    { setSlashMenu(null); return; }
    }
    // Auto-continue lists on Enter
    if (e.key === "Enter") {
      const ta   = e.currentTarget;
      const s    = ta.selectionStart;
      const ls   = content.lastIndexOf("\n", s - 1) + 1;
      const line = content.substring(ls, s);
      const bull = line.match(/^(\s*[-*+] (?:\[[ x]\] )?)/);
      const num  = line.match(/^(\s*)(\d+)\. /);
      if (bull && line.trim().length > bull[1].trim().length) {
        e.preventDefault();
        const pfx = bull[1];
        const nxt = content.substring(0, s) + "\n" + pfx + content.substring(s);
        commit(nxt, s + 1 + pfx.length);
        return;
      }
      if (num) {
        e.preventDefault();
        const spaces = num[1];
        const n      = parseInt(num[2]) + 1;
        const pfx    = `${spaces}${n}. `;
        const nxt    = content.substring(0, s) + "\n" + pfx + content.substring(s);
        commit(nxt, s + 1 + pfx.length);
        return;
      }
    }
  }

  const toolbarGroups = [
    [
      { l: "B",   t: "Negrito (Ctrl+B)",    fn: () => applyInline("**", "**"), s: { fontWeight: 700 } },
      { l: "I",   t: "Itálico (Ctrl+I)",     fn: () => applyInline("*",  "*"),  s: { fontStyle: "italic" as const } },
      { l: "~~",  t: "Tachado",              fn: () => applyInline("~~", "~~"), s: {} },
    ],
    [
      { l: "H1",  t: "Título 1",  fn: () => applyLine("# "),     s: {} },
      { l: "H2",  t: "Título 2",  fn: () => applyLine("## "),    s: {} },
      { l: "H3",  t: "Título 3",  fn: () => applyLine("### "),   s: {} },
    ],
    [
      { l: "•",   t: "Lista com marcadores",  fn: () => applyLine("- "),      s: {} },
      { l: "1.",  t: "Lista numerada",         fn: () => applyLine("1. "),     s: {} },
      { l: "☐",   t: "Lista de tarefas",       fn: () => applyLine("- [ ] "),  s: {} },
    ],
    [
      { l: "`",    t: "Código inline (Ctrl+K)", fn: () => applyInline("`",    "`"),    s: { fontFamily: "monospace" as const } },
      { l: "```",  t: "Bloco de código",        fn: () => applyInline("```\n","\n```"),s: { fontFamily: "monospace" as const } },
    ],
    [
      { l: "❝",   t: "Citação",  fn: () => applyLine("> "),         s: {} },
      { l: "—",   t: "Divisor",  fn: () => applyInline("\n---\n"),  s: {} },
    ],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 101px)" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2, padding: "5px 12px", borderBottom: "1px solid var(--color-border)", background: "var(--color-bg2)", flexShrink: 0 }}>
        {toolbarGroups.map((grp, gi) => (
          <div key={gi} style={{ display: "flex", alignItems: "center", gap: 1 }}>
            {gi > 0 && <div style={{ width: 1, height: 14, background: "var(--color-border2)", margin: "0 4px" }} />}
            {grp.map(btn => (
              <button key={btn.l} title={btn.t} onMouseDown={e => { e.preventDefault(); btn.fn(); }}
                style={{ width: 28, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, border: "none", borderRadius: 4, cursor: "pointer", background: "transparent", color: "var(--color-f3)", transition: "all 100ms", ...btn.s }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-f1)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-f3)"; }}
              >{btn.l}</button>
            ))}
          </div>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, color: "var(--color-f4)", display: "flex", alignItems: "center", gap: 4 }}>
            Digite <kbd style={{ background: "var(--color-bg3)", border: "1px solid var(--color-border2)", borderRadius: 3, padding: "0 4px", fontFamily: "monospace", fontSize: 10 }}>/</kbd> para comandos
          </span>
          <div style={{ width: 1, height: 12, background: "var(--color-border)" }} />
          {isSaving && <span style={{ fontSize: 10, color: "var(--color-f4)", display: "flex", alignItems: "center", gap: 3 }}><IconLoader2 size={10} style={{ animation: "spin 1s linear infinite" }} />salvando…</span>}
          {saved    && <span style={{ fontSize: 10, color: "var(--color-green)" }}>✓ salvo</span>}
          {!isSaving && !saved && <span style={{ fontSize: 10, color: "var(--color-f4)" }}>auto-save 2s</span>}
        </div>
      </div>

      {/* Split pane */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Editor */}
        <div style={{ flex: 1, borderRight: "1px solid var(--color-border)", display: "flex", flexDirection: "column", position: "relative" }}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onClick={() => setSlashMenu(null)}
            style={{ flex: 1, background: "transparent", border: "none", padding: "16px 20px", fontSize: 13, color: "var(--color-f2)", resize: "none", outline: "none", fontFamily: "monospace", lineHeight: 1.7 }}
            placeholder="Notas administrativas… (/ para comandos, Ctrl+B bold, Ctrl+I italic)"
          />

          {/* Slash command menu */}
          {slashMenu && filteredCmds.length > 0 && (
            <div style={{ position: "absolute", bottom: 12, left: 20, background: "var(--color-bg2)", border: "1px solid var(--color-border2)", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", overflow: "hidden", minWidth: 210, zIndex: 100 }}>
              <div style={{ padding: "5px 10px 4px", fontSize: 9, color: "var(--color-f4)", letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid var(--color-border)" }}>Comandos</div>
              {filteredCmds.map((cmd, i) => (
                <div key={cmd.id} onMouseDown={e => { e.preventDefault(); applySlash(cmd); }} onMouseEnter={() => setSlashSel(i)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 12px", cursor: "pointer", fontSize: 12, background: i === slashSel ? "rgba(34,211,238,0.08)" : "transparent", color: i === slashSel ? "var(--color-f1)" : "var(--color-f2)", transition: "background 100ms" }}>
                  <span style={{ width: 24, height: 24, background: "var(--color-bg3)", border: "1px solid var(--color-border)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontFamily: "monospace", color: "var(--color-cyan)", flexShrink: 0 }}>{cmd.icon}</span>
                  {cmd.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 32px" }}>
          <style>{`
            .notes-md h1 { font-size: 22px; font-weight: 700; color: var(--color-f1); margin: 0 0 8px; }
            .notes-md h2 { font-size: 16px; font-weight: 600; color: var(--color-f1); margin: 28px 0 10px; padding-bottom: 6px; border-bottom: 1px solid var(--color-border); }
            .notes-md h3 { font-size: 13px; font-weight: 600; color: var(--color-cyan); margin: 18px 0 6px; }
            .notes-md p  { font-size: 13px; color: var(--color-f2); line-height: 1.7; margin: 0 0 10px; }
            .notes-md ul, .notes-md ol { margin: 0 0 10px; padding-left: 20px; }
            .notes-md li { font-size: 13px; color: var(--color-f2); line-height: 1.7; margin-bottom: 2px; }
            .notes-md code { font-family: monospace; font-size: 11.5px; background: var(--color-bg3); border: 1px solid var(--color-border); border-radius: 4px; padding: 1px 5px; color: var(--color-cyan); }
            .notes-md pre  { background: var(--color-bg3); border: 1px solid var(--color-border); border-radius: 8px; padding: 14px; overflow-x: auto; margin: 0 0 14px; }
            .notes-md pre code { background: none; border: none; padding: 0; font-size: 12px; color: var(--color-f2); }
            .notes-md hr { border: none; border-top: 1px solid var(--color-border); margin: 24px 0; }
            .notes-md strong { color: var(--color-f1); font-weight: 600; }
            .notes-md em { color: var(--color-f2); }
            .notes-md del { color: var(--color-f4); }
            .notes-md blockquote { border-left: 3px solid var(--color-cyan-border); padding-left: 12px; margin: 0 0 10px; color: var(--color-f3); font-style: italic; }
            .notes-md input[type=checkbox] { margin-right: 6px; }
            .notes-md a { color: var(--color-cyan); text-decoration: none; }
            .notes-md a:hover { text-decoration: underline; }
          `}</style>
          {content ? (
            <div className="notes-md">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--color-f4)", fontStyle: "italic" }}>Prévia aparece aqui…</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── User Combobox ── */
type UserOption = { id: string; name: string; email: string | null };

function UserCombobox({ users, value, onChange }: {
  users: UserOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const allOptions = [{ id: "all", name: "Todos os usuários", email: null }, ...users];
  const selected = allOptions.find(u => u.id === value) ?? allOptions[0];

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim() === ""
    ? allOptions
    : allOptions.filter(u =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        (u.email ?? "").toLowerCase().includes(query.toLowerCase())
      );

  // close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function select(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} style={{ position: "relative", width: 220 }}>
      {/* trigger */}
      <div
        onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 10); }}
        style={{
          height: 32, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 10px", fontSize: 12, borderRadius: 6, cursor: "pointer",
          background: "var(--color-bg3)", border: `1px solid ${open ? "rgba(34,211,238,0.4)" : "var(--color-border2)"}`,
          color: "var(--color-f2)", userSelect: "none", transition: "border-color 150ms",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected.name}
        </span>
        <IconChevronDown size={12} style={{ flexShrink: 0, marginLeft: 6, color: "var(--color-f4)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms" }} />
      </div>

      {/* dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          background: "var(--color-bg2)", border: "1px solid var(--color-border2)",
          borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", overflow: "hidden",
        }}>
          {/* search input */}
          <div style={{ padding: "8px 8px 6px", borderBottom: "1px solid var(--color-border)" }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar usuário…"
              style={{
                width: "100%", height: 28, background: "var(--color-bg3)",
                border: "1px solid var(--color-border2)", borderRadius: 5,
                padding: "0 8px", fontSize: 11, color: "var(--color-f1)", outline: "none",
              }}
            />
          </div>
          {/* options */}
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "10px 12px", fontSize: 11, color: "var(--color-f4)" }}>Nenhum resultado.</div>
            ) : filtered.map(u => (
              <div
                key={u.id}
                onClick={() => select(u.id)}
                style={{
                  padding: "8px 12px", cursor: "pointer", fontSize: 12,
                  background: u.id === value ? "rgba(34,211,238,0.07)" : "transparent",
                  color: u.id === value ? "var(--color-cyan)" : "var(--color-f2)",
                  transition: "background 100ms",
                  display: "flex", flexDirection: "column", gap: 1,
                }}
                onMouseEnter={e => { if (u.id !== value) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (u.id !== value) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                <span>{u.name}</span>
                {u.email && <span style={{ fontSize: 10, color: "var(--color-f4)" }}>{u.email}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Data Tab ── */
type EventTypeFilter = "all" | "transaction" | "education" | "goal" | "notification" | "system";

const EVENT_FILTER_OPTIONS: { value: EventTypeFilter; label: string; color: string }[] = [
  { value: "all",          label: "Todos",        color: "var(--color-f3)" },
  { value: "transaction",  label: "Transações",   color: "#A3E635" },
  { value: "education",    label: "Educação",     color: "#22D3EE" },
  { value: "goal",         label: "Metas",        color: "#34D399" },
  { value: "notification", label: "Alertas",      color: "#FBBF24" },
  { value: "system",       label: "Sistema",      color: "#A78BFA" },
];

const EVENT_DOT: Record<string, string> = {
  transaction:  "#A3E635",
  education:    "#22D3EE",
  goal:         "#34D399",
  notification: "#FBBF24",
  system:       "#A78BFA",
};

const EVENT_LABEL: Record<string, string> = {
  transaction:  "Transação",
  education:    "Educação",
  goal:         "Meta",
  notification: "Alerta",
  system:       "Sistema",
};

function DataTab({ data }: { data: StudioData }) {
  const [eventType, setEventType]     = useState<EventTypeFilter>("all");
  const [selectedPlan, setSelectedPlan] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [events, setEvents]           = useState<AuditEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [isLoading, startLoading]     = useTransition();

  const dbSize = (() => {
    const b = data.dbSizeBytes;
    if (b >= 1024 * 1024 * 1024) return `${(b / (1024 ** 3)).toFixed(2)} GB`;
    if (b >= 1024 * 1024)        return `${(b / (1024 ** 2)).toFixed(2)} MB`;
    if (b >= 1024)               return `${(b / 1024).toFixed(1)} KB`;
    return `${b} B`;
  })();

  function loadEvents(et: EventTypeFilter, planId: string, userId: string) {
    startLoading(async () => {
      const result = await adminGetEventLog({
        eventType: et === "all" ? undefined : et,
        planId:    planId === "all" ? undefined : planId,
        userId:    userId === "all" ? undefined : userId,
        limit: 100,
      });
      setEvents(result);
      setEventsLoaded(true);
    });
  }

  // Initial load on mount
  useEffect(() => {
    loadEvents("all", "all", "all");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleEventType(et: EventTypeFilter) {
    setEventType(et);
    loadEvents(et, selectedPlan, selectedUser);
  }

  function handlePlan(planId: string) {
    setSelectedPlan(planId);
    setSelectedUser("all");
    loadEvents(eventType, planId, "all");
  }

  function handleUser(userId: string) {
    setSelectedUser(userId);
    loadEvents(eventType, selectedPlan, userId);
  }

  const planOptions: SelectOption[] = [
    { value: "all", label: "Todos os planos" },
    ...data.plans.map((p) => ({ value: p.id, label: p.name })),
  ];

  const filteredUsers = selectedPlan === "all"
    ? data.users
    : data.users.filter((u) => u.planId === selectedPlan);

  const userOptions: SelectOption[] = [
    { value: "all", label: "Todos os usuários" },
    ...filteredUsers.map((u) => ({ value: u.id, label: u.name })),
  ];

  return (
    <div>
      {/* ── Stats: Sistema ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "var(--color-f4)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>
          Sistema
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { label: "Usuários",         value: data.userCount,                           color: "#22D3EE", sub: "contas ativas" },
            { label: "Registros totais", value: data.totalRecords.toLocaleString("pt-BR"), color: "#A78BFA", sub: "em todas as tabelas" },
            { label: "Tamanho do banco", value: dbSize,                                   color: "#FB923C", sub: "banco PostgreSQL" },
          ].map((s) => (
            <div key={s.label} style={{ background: "var(--color-bg2)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontStyle: "italic", fontFamily: "var(--font-display)", color: s.color, marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--color-f2)", fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: 10, color: "var(--color-f4)", marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats: Dados de usuários ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: "var(--color-f4)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>
          Dados de usuários
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { label: "Transações", value: data.txCount,     color: "#A3E635" },
            { label: "Tags",       value: data.tagCount,    color: "#FBBF24" },
            { label: "Orçamentos", value: data.budgetCount, color: "#FB923C" },
            { label: "Metas",      value: data.goalCount,   color: "#22D3EE" },
          ].map((s) => (
            <div key={s.label} style={{ background: "var(--color-bg2)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 24, fontWeight: 700, fontStyle: "italic", fontFamily: "var(--font-display)", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--color-f4)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Event log header ── */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-f1)" }}>Log de eventos</span>
        {isLoading && (
          <IconLoader2 size={13} style={{ color: "var(--color-f4)", animation: "spin 1s linear infinite" }} />
        )}
      </div>

      {/* ── Filter bar: pills + dropdowns on the same row ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {EVENT_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleEventType(opt.value)}
            style={{
              padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 500,
              cursor: "pointer", border: "1px solid",
              background: eventType === opt.value ? `${opt.color}1A` : "transparent",
              borderColor: eventType === opt.value ? opt.color : "var(--color-border2)",
              color: eventType === opt.value ? opt.color : "var(--color-f4)",
              transition: "all 150ms",
            }}
          >
            {opt.label}
          </button>
        ))}
        </div>

        {/* Dropdowns — right side, same row as pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <IconFilter size={12} style={{ color: "var(--color-f4)" }} />
          <div style={{ width: 160 }}>
            <StudioSelect value={selectedPlan} onChange={handlePlan} options={planOptions} placeholder="Todos os planos" />
          </div>
          <div style={{ width: 160 }}>
            <StudioSelect value={selectedUser} onChange={handleUser} options={userOptions} placeholder="Todos os usuários" />
          </div>
        </div>
      </div>

      {/* ── System events notice ── */}
      {eventType === "system" && (selectedPlan !== "all" || selectedUser !== "all") && (
        <div style={{ fontSize: 11, color: "var(--color-amber)", marginBottom: 14, padding: "6px 10px", borderRadius: 6, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
          Eventos de sistema são globais e não aplicam filtros de plano ou usuário.
        </div>
      )}

      {/* ── Event log timeline ── */}
      {!eventsLoaded ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-f4)", fontSize: 12, padding: "32px 0" }}>
          <IconLoader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          Carregando eventos…
        </div>
      ) : events.length === 0 ? (
        <div style={{ color: "var(--color-f4)", fontSize: 13, padding: "32px 0", textAlign: "center" }}>
          Nenhum evento encontrado para os filtros selecionados.
        </div>
      ) : (
        <div>
          {events.map((ev, idx) => {
            const dot = EVENT_DOT[ev.eventType] ?? "var(--color-f4)";
            const planName = ev.userPlanId ? (data.plans.find((p) => p.id === ev.userPlanId)?.name ?? null) : null;
            return (
              <div
                key={ev.id}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  padding: "10px 0",
                  borderBottom: idx < events.length - 1 ? "1px solid var(--color-border)" : "none",
                }}
              >
                {/* Timeline dot */}
                <div style={{ paddingTop: 5, flexShrink: 0 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: dot }} />
                </div>

                {/* Main content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 2 }}>
                    <span style={{ fontSize: 13, color: "var(--color-f1)", fontWeight: 500 }}>
                      {ev.title}
                    </span>
                    <span style={{
                      fontSize: 9, padding: "1px 6px", borderRadius: 999,
                      background: `${dot}1A`, color: dot,
                      fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px",
                    }}>
                      {EVENT_LABEL[ev.eventType] ?? ev.eventType}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-f3)" }}>{ev.detail}</div>
                  {ev.userName && (
                    <div style={{ fontSize: 10, color: "var(--color-f4)", marginTop: 2 }}>
                      {ev.userName}
                      {planName && (
                        <span style={{ marginLeft: 5, opacity: 0.7 }}>· {planName}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div style={{ fontSize: 10, color: "var(--color-f4)", whiteSpace: "nowrap", paddingTop: 3, flexShrink: 0 }}>
                  {new Date(ev.timestamp).toLocaleString("pt-BR", {
                    day: "2-digit", month: "2-digit", year: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── CS-18: Custom select com identidade Lyfx ── */
interface SelectOption { value: string; label: string }

function StudioSelect({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const selected = options.find(o => o.value === value);
  const display = selected?.label ?? placeholder ?? "Selecione…";

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", height: 38, background: "var(--color-bg3)",
          border: `1px solid ${open ? "var(--color-cyan-border)" : "var(--color-border2)"}`,
          borderRadius: 8, padding: "0 12px", fontSize: 13,
          color: selected ? "var(--color-f1)" : "var(--color-f4)",
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 8, outline: "none",
          boxShadow: open ? "0 0 0 3px rgba(34,211,238,0.08)" : "none",
          transition: "border-color 150ms, box-shadow 150ms",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {display}
        </span>
        <IconChevronDown
          size={13}
          style={{
            color: "var(--color-f4)", flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 150ms",
          }}
        />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
          background: "var(--color-bg3)",
          border: "1px solid var(--color-cyan-border)",
          borderRadius: 8, overflow: "hidden",
          boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                width: "100%", height: 36, padding: "0 12px",
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 13, cursor: "pointer", border: "none", textAlign: "left",
                background: opt.value === value ? "rgba(34,211,238,0.08)" : "transparent",
                color: opt.value === value ? "var(--color-cyan)" : "var(--color-f2)",
                transition: "background 100ms",
              }}
              onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { if (opt.value !== value) e.currentTarget.style.background = "transparent"; }}
            >
              {opt.value === value && (
                <IconCheck size={12} style={{ color: "var(--color-cyan)", flexShrink: 0 }} />
              )}
              <span style={{ marginLeft: opt.value === value ? 0 : 20 }}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── CS-18: Notification form (shared by create + edit modals) ── */
type UserItem = { id: string; name: string; email: string | null };
type PlanItemBase = { id: string; name: string; color: string };

/* ── Notification form (inside modal) ── */
function NotifForm({
  users, plans,
  initial,
  onSave, onClose,
}: {
  users: UserItem[]; plans: PlanItemBase[];
  initial?: NotifBroadcast;
  onSave: () => void; onClose: () => void;
}) {
  const isEdit = !!initial;
  const [recipientType, setRecipientType] = useState<"all" | "plan" | "user">("all");
  const [planId, setPlanId] = useState("");
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [type, setType] = useState<"info" | "warning" | "danger" | "success">(initial?.type ?? "info");
  const [link, setLink] = useState(initial?.link ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 38, background: "var(--color-bg3)",
    border: "1px solid var(--color-border2)", borderRadius: 8,
    padding: "0 12px", fontSize: 13, color: "var(--color-f1)", outline: "none",
    transition: "border-color 150ms, box-shadow 150ms",
  };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: "var(--color-f3)", marginBottom: 4, display: "block" };
  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = "var(--color-cyan-border)";
      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(34,211,238,0.08)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = "var(--color-border2)";
      e.currentTarget.style.boxShadow = "none";
    },
  };

  const typeColors: Record<string, string> = {
    info: "var(--color-cyan)", warning: "var(--color-amber)",
    danger: "var(--color-red)", success: "#A3E635",
  };

  const recipientOptions: SelectOption[] = [
    { value: "all", label: "Todos os usuários" },
    { value: "plan", label: "Por plano" },
    { value: "user", label: "Usuário específico" },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      if (isEdit) {
        const result = await adminUpdateNotification(
          initial!.broadcastId, initial!.sampleId,
          { title, body, type, link: link || null }
        );
        if ("error" in result) { setError(result.error); return; }
      } else {
        const result = await adminSendNotification({
          recipientType,
          planId: recipientType === "plan" ? planId : undefined,
          userId: recipientType === "user" ? userId : undefined,
          title, body, type, link: link || undefined,
        });
        if ("error" in result) { setError(result.error); return; }
      }
      onSave();
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {!isEdit && (
        <>
          <div>
            <label style={labelStyle}>Destinatários</label>
            <StudioSelect value={recipientType} onChange={v => setRecipientType(v as "all" | "plan" | "user")} options={recipientOptions} />
          </div>
          {recipientType === "plan" && (
            <div>
              <label style={labelStyle}>Plano</label>
              <StudioSelect value={planId} onChange={setPlanId} options={[{ value: "", label: "Selecione um plano…" }, ...plans.map(p => ({ value: p.id, label: p.name }))]} />
            </div>
          )}
          {recipientType === "user" && (
            <div>
              <label style={labelStyle}>Usuário</label>
              <StudioSelect value={userId} onChange={setUserId} options={[{ value: "", label: "Selecione um usuário…" }, ...users.map(u => ({ value: u.id, label: u.name + (u.email ? ` — ${u.email}` : "") }))]} />
            </div>
          )}
        </>
      )}

      {/* Tipo */}
      <div>
        <label style={labelStyle}>Tipo</label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["info", "warning", "danger", "success"] as const).map(t => (
            <button key={t} type="button" onClick={() => setType(t)} style={{
              flex: 1, height: 34, borderRadius: 8, fontSize: 12, fontWeight: 500,
              cursor: "pointer", transition: "all 150ms", border: "1px solid",
              background: type === t ? `${typeColors[t]}18` : "var(--color-bg3)",
              borderColor: type === t ? typeColors[t] : "var(--color-border2)",
              color: type === t ? typeColors[t] : "var(--color-f3)",
            }}>
              {t === "info" ? "Info" : t === "warning" ? "Aviso" : t === "danger" ? "Urgente" : "Sucesso"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Título</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título da notificação" style={inputStyle} required {...focusHandlers} />
      </div>

      <div>
        <label style={labelStyle}>Mensagem</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Texto da notificação…" rows={3} required
          style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "vertical" }} {...focusHandlers} />
      </div>

      <div>
        <label style={labelStyle}>Link <span style={{ color: "var(--color-f4)" }}>(opcional)</span></label>
        <input value={link} onChange={e => setLink(e.target.value)} placeholder="/dashboard" style={inputStyle} {...focusHandlers} />
      </div>

      {error && (
        <div style={{ fontSize: 12, color: "var(--color-red)", padding: "8px 12px", borderRadius: 8, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
        <button type="button" onClick={onClose} style={{
          height: 36, padding: "0 16px", borderRadius: 8, fontSize: 13,
          background: "none", border: "1px solid var(--color-border2)",
          color: "var(--color-f3)", cursor: "pointer",
        }}>
          Cancelar
        </button>
        <button type="submit" disabled={isPending} style={{
          height: 36, padding: "0 16px", background: "var(--color-cyan)", color: "#083344",
          border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          opacity: isPending ? 0.7 : 1,
        }}>
          {isPending
            ? <><IconLoader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> {isEdit ? "Salvando…" : "Enviando…"}</>
            : <><IconSend size={14} /> {isEdit ? "Salvar alterações" : "Enviar notificação"}</>}
        </button>
      </div>
    </form>
  );
}

/* ── Notification type config ── */
const NOTIF_STUDIO_CONFIG = {
  info:    { color: "var(--color-cyan)",   bg: "rgba(34,211,238,0.08)",   label: "Info"    },
  warning: { color: "var(--color-amber)",  bg: "rgba(251,191,36,0.08)",   label: "Aviso"   },
  danger:  { color: "var(--color-red)",    bg: "rgba(248,113,113,0.08)",  label: "Urgente" },
  success: { color: "#A3E635",             bg: "rgba(163,230,53,0.08)",   label: "Sucesso" },
} as const;

/* ── Notifications tab ── */
function NotificationsTab({ users, plans }: { users: UserItem[]; plans: PlanItemBase[] }) {
  const [broadcasts, setBroadcasts] = useState<NotifBroadcast[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "new" | NotifBroadcast>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    try { setBroadcasts(await adminGetManualNotifications()); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function handleSave() {
    setModal(null);
    load();
  }

  function handleDelete(b: NotifBroadcast) {
    const key = b.broadcastId ?? b.sampleId;
    setDeletingId(key);
    startTransition(async () => {
      await adminDeleteNotification(b.broadcastId, b.sampleId);
      setDeletingId(null);
      load();
    });
  }

  const rowStyle: React.CSSProperties = {
    display: "flex", alignItems: "flex-start", gap: 14,
    padding: "14px 16px", borderRadius: 10,
    background: "var(--color-bg2)", border: "1px solid var(--color-border)",
    transition: "border-color 150ms",
  };

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-f1)", margin: 0 }}>Notificações</h2>
          <p style={{ fontSize: 12, color: "var(--color-f4)", marginTop: 3 }}>
            Notificações manuais enviadas via Studio. Mostra leituras em tempo real.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal("new")}
          style={{
            height: 36, padding: "0 14px", background: "var(--color-cyan)", color: "#083344",
            border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
          }}
        >
          <IconPlus size={14} /> Nova notificação
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-f4)", fontSize: 13 }}>
          <IconLoader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Carregando…
        </div>
      ) : !broadcasts || broadcasts.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "60px 0", gap: 10, color: "var(--color-f4)",
        }}>
          <IconBell size={28} style={{ opacity: 0.3 }} />
          <span style={{ fontSize: 13 }}>Nenhuma notificação enviada ainda.</span>
          <button type="button" onClick={() => setModal("new")} style={{
            marginTop: 4, fontSize: 12, color: "var(--color-cyan)", background: "none",
            border: "none", cursor: "pointer", textDecoration: "underline",
          }}>
            Enviar a primeira
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 720 }}>
          {broadcasts.map((b) => {
            const cfg = NOTIF_STUDIO_CONFIG[b.type] ?? NOTIF_STUDIO_CONFIG.info;
            const key = b.broadcastId ?? b.sampleId;
            const isDeleting = deletingId === key;
            const readPct = b.totalCount > 0 ? Math.round((b.readCount / b.totalCount) * 100) : 0;

            return (
              <div key={key} style={{ ...rowStyle, opacity: isDeleting ? 0.4 : 1 }}>
                {/* Type badge */}
                <div style={{
                  flexShrink: 0, width: 6, height: 6,
                  borderRadius: "50%", background: cfg.color, marginTop: 6,
                }} />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-f1)" }}>{b.title}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                      padding: "2px 7px", borderRadius: 4, background: cfg.bg, color: cfg.color,
                    }}>
                      {cfg.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--color-f3)", margin: "0 0 6px", lineHeight: 1.5 }}>{b.body}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "var(--color-f4)" }}>
                    {/* Leitura */}
                    <span title={`${b.readCount} de ${b.totalCount} leram`}>
                      <span style={{ color: b.readCount === b.totalCount ? "#A3E635" : "var(--color-f4)", fontWeight: 500 }}>
                        {b.readCount}/{b.totalCount}
                      </span>
                      {" "}leram · {readPct}%
                    </span>
                    {/* Progress bar */}
                    <div style={{ width: 60, height: 3, borderRadius: 999, background: "var(--color-border2)", overflow: "hidden" }}>
                      <div style={{ width: `${readPct}%`, height: "100%", background: b.readCount === b.totalCount ? "#A3E635" : cfg.color, borderRadius: 999, transition: "width 300ms" }} />
                    </div>
                    <span>·</span>
                    <span>{new Date(b.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    {b.link && <span>· <span style={{ color: "var(--color-cyan)" }}>{b.link}</span></span>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button type="button" onClick={() => setModal(b)} title="Editar" style={{
                    width: 30, height: 30, borderRadius: 7, background: "none",
                    border: "1px solid var(--color-border2)", color: "var(--color-f3)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 150ms",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-cyan-border)"; e.currentTarget.style.color = "var(--color-cyan)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border2)"; e.currentTarget.style.color = "var(--color-f3)"; }}
                  >
                    <IconEdit size={13} />
                  </button>
                  <button type="button" onClick={() => handleDelete(b)} disabled={isDeleting} title="Apagar" style={{
                    width: 30, height: 30, borderRadius: 7, background: "none",
                    border: "1px solid var(--color-border2)", color: "var(--color-f4)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 150ms",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(248,113,113,0.4)"; e.currentTarget.style.color = "var(--color-red)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border2)"; e.currentTarget.style.color = "var(--color-f4)"; }}
                  >
                    {isDeleting ? <IconLoader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <IconTrash size={13} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div style={{
            width: 520, background: "var(--color-bg2)",
            border: "1px solid var(--color-border2)", borderRadius: 16,
            padding: 28, boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--color-f1)" }}>
                {modal === "new" ? "Nova notificação" : "Editar notificação"}
              </span>
              <button type="button" onClick={() => setModal(null)} style={{
                width: 28, height: 28, borderRadius: 8, background: "var(--color-bg3)",
                border: "1px solid var(--color-border2)", color: "var(--color-f3)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <IconX size={13} />
              </button>
            </div>
            <NotifForm
              users={users} plans={plans}
              initial={modal === "new" ? undefined : modal}
              onSave={handleSave}
              onClose={() => setModal(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}

/* ── Security Tab (CS-35) ─────────────────────────────────────────────────── */

const SECURITY_VARIANT_STYLES = {
  success: { color: "#4ADE80", bg: "rgba(74,222,128,0.07)",   border: "rgba(74,222,128,0.2)" },
  danger:  { color: "#F87171", bg: "rgba(248,113,113,0.07)",  border: "rgba(248,113,113,0.2)" },
  warning: { color: "#FBBF24",  bg: "rgba(251,191,36,0.07)",  border: "rgba(251,191,36,0.2)" },
  info:    { color: "#22D3EE", bg: "rgba(34,211,238,0.07)",   border: "rgba(34,211,238,0.2)" },
} as const;

function SecurityEventIcon({ variant }: { variant: AdminSecurityEvent["variant"] }) {
  const color = SECURITY_VARIANT_STYLES[variant].color;
  const props = { size: 13, color, style: { flexShrink: 0 as const } };
  if (variant === "success") return <IconShieldCheck       {...props} />;
  if (variant === "danger")  return <IconShieldX           {...props} />;
  if (variant === "warning") return <IconShieldExclamation {...props} />;
  return                            <IconShieldLock        {...props} />;
}

function formatSecDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).format(new Date(date));
}

type UserFilterOption = { id: string; name: string };

function SecurityTab({ users }: { users: UserFilterOption[] }) {
  const [logs,      setLogs]      = useState<AdminSecurityEvent[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const SECURITY_ACTIONS = [
    { key: "",                    label: "Todos os eventos" },
    { key: "auth.login.success",  label: "Login bem-sucedido" },
    { key: "auth.login.failed",   label: "Falha de login" },
    { key: "auth.login.blocked",  label: "IP bloqueado" },
    { key: "auth.login.captcha",  label: "CAPTCHA exigido" },
    { key: "auth.logout",         label: "Logout" },
    { key: "auth.password.changed", label: "Senha alterada" },
    { key: "session.revoked",     label: "Sessão revogada" },
    { key: "session.revoked_all", label: "Todas sessões revogadas" },
  ];

  async function load() {
    setLoading(true);
    try {
      const data = await getAdminSecurityLog({
        userId: filterUser  || undefined,
        action: filterAction || undefined,
        limit:  200,
      });
      setLogs(data);
    } finally {
      setLoading(false);
    }
  }

  // load on mount + filter changes
  useEffect(() => { load(); }, [filterUser, filterAction]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectStyle: React.CSSProperties = {
    height: 34, padding: "0 10px", fontSize: 12,
    background: "var(--color-bg3)", border: "1px solid var(--color-border2)",
    borderRadius: 6, color: "var(--color-f2)", outline: "none", cursor: "pointer",
  };

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Log de segurança</div>
          <div style={{ fontSize: 12, color: "var(--color-f4)" }}>
            Eventos de autenticação e sessões de todos os usuários
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", fontSize: 11, borderRadius: 6, border: "1px solid var(--color-border2)", background: "var(--color-bg3)", color: "var(--color-f2)", cursor: "pointer" }}
        >
          {loading ? <IconLoader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <IconRefresh size={12} />}
          Atualizar
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select value={filterUser} onChange={e => setFilterUser(e.target.value)} style={selectStyle}>
          <option value="">Todos os usuários</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)} style={selectStyle}>
          {SECURITY_ACTIONS.map(a => (
            <option key={a.key} value={a.key}>{a.label}</option>
          ))}
        </select>
        {(filterUser || filterAction) && (
          <button
            onClick={() => { setFilterUser(""); setFilterAction(""); }}
            style={{ ...selectStyle, color: "var(--color-cyan)", borderColor: "rgba(34,211,238,0.3)", paddingRight: 12 }}
          >
            <IconX size={10} style={{ marginRight: 4 }} />
            Limpar filtros
          </button>
        )}
      </div>

      {/* Counter */}
      {!loading && (
        <div style={{ fontSize: 11, color: "var(--color-f4)", marginBottom: 10 }}>
          {logs.length} evento{logs.length !== 1 ? "s" : ""}
          {logs.length === 200 ? " (mostrando os últimos 200)" : ""}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-f4)" }}>
          <IconLoader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          Carregando eventos...
        </div>
      ) : logs.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--color-f4)", padding: "32px 0", textAlign: "center" }}>
          Nenhum evento de segurança registrado.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {logs.map(log => {
            const style = SECURITY_VARIANT_STYLES[log.variant];
            return (
              <div
                key={log.id}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "10px 14px", borderRadius: 10,
                  background: style.bg, border: `1px solid ${style.border}`,
                }}
              >
                <div style={{ marginTop: 2 }}>
                  <SecurityEventIcon variant={log.variant} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: style.color }}>{log.label}</span>
                    {log.userName && (
                      <span style={{ fontSize: 11, color: "var(--color-f2)", background: "var(--color-bg3)", border: "1px solid var(--color-border)", borderRadius: 4, padding: "1px 6px" }}>
                        {log.userName}
                        {log.userEmail && <span style={{ color: "var(--color-f4)", marginLeft: 4 }}>{log.userEmail}</span>}
                      </span>
                    )}
                    {!log.userName && (
                      <span style={{ fontSize: 10, color: "var(--color-f4)", fontStyle: "italic" }}>anônimo</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-f3)" }}>{log.description}</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 3, flexWrap: "wrap" }}>
                    {log.ip && (
                      <span style={{ fontSize: 10, color: "var(--color-f4)", fontFamily: "monospace" }}>IP: {log.ip}</span>
                    )}
                    <span style={{ fontSize: 10, color: "var(--color-f4)" }}>{formatSecDate(log.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

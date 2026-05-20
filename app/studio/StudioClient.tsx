"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { adminLogin, adminLogout, adminResetPassword, adminDeleteUser, adminCreateUser, getStudioDataForUser } from "./actions";
import {
  IconLock, IconLoader2, IconX, IconLogout, IconDatabase,
  IconUsers, IconTable, IconKey, IconTrash, IconChevronDown, IconChevronRight,
  IconFileDescription, IconUserPlus, IconFilter,
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

/* ── Schema definitions ── */
const SCHEMA = [
  {
    table: "User",
    color: "#22D3EE",
    desc: "Usuário do sistema. App pessoal — apenas 1 registro.",
    fields: [
      { name: "id", type: "String", note: "cuid(), chave primária" },
      { name: "name", type: "String", note: "Nome de exibição" },
      { name: "email", type: "String?", note: "Único, opcional" },
      { name: "password", type: "String", note: "Hash bcrypt (min 6 chars)" },
      { name: "avatar", type: "String?", note: "Base64 JPEG 200×200px" },
      { name: "age", type: "Int?", note: "Idade" },
      { name: "gender", type: "String?", note: "Gênero" },
      { name: "address", type: "String?", note: "Endereço" },
      { name: "createdAt", type: "DateTime", note: "Auto: now()" },
      { name: "updatedAt", type: "DateTime", note: "Auto: updatedAt" },
    ],
  },
  {
    table: "Transaction",
    color: "#A3E635",
    desc: "Lançamento financeiro — receita ou despesa.",
    fields: [
      { name: "id", type: "String", note: "cuid(), chave primária" },
      { name: "date", type: "DateTime", note: "Data do lançamento" },
      { name: "description", type: "String", note: "Título do lançamento" },
      { name: "amount", type: "Float", note: "Valor em reais (positivo)" },
      { name: "type", type: "String", note: '"income" | "expense"' },
      { name: "category", type: "String", note: "Ex: moradia, alimentação, saúde…" },
      { name: "subcategory", type: "String?", note: "Subdivisão da categoria" },
      { name: "notes", type: "String?", note: "Observações livres" },
      { name: "recurrence", type: "String", note: '"once" | "monthly" | "yearly"' },
      { name: "context", type: "String?", note: '"personal" | "professional"' },
      { name: "reimbursable", type: "Boolean", note: "Despesa reembolsável" },
      { name: "createdAt", type: "DateTime", note: "Auto: now()" },
      { name: "updatedAt", type: "DateTime", note: "Auto: updatedAt" },
      { name: "tags", type: "TransactionTag[]", note: "Relação N:N com Tag" },
    ],
  },
  {
    table: "Tag",
    color: "#FBBF24",
    desc: "Etiqueta associada a transações.",
    fields: [
      { name: "id", type: "String", note: "cuid(), chave primária" },
      { name: "name", type: "String", note: "Único" },
      { name: "color", type: "String", note: "Hex, ex: #22D3EE" },
      { name: "icon", type: "String", note: "Chave do TAG_ICONS (tag, home, car…)" },
      { name: "createdAt", type: "DateTime", note: "Auto: now()" },
      { name: "transactions", type: "TransactionTag[]", note: "Relação N:N" },
    ],
  },
  {
    table: "TransactionTag",
    color: "#A78BFA",
    desc: "Tabela pivot da relação N:N entre Transaction e Tag.",
    fields: [
      { name: "transactionId", type: "String", note: "FK → Transaction.id (cascade)" },
      { name: "tagId", type: "String", note: "FK → Tag.id (cascade)" },
    ],
  },
  {
    table: "Budget",
    color: "#FB923C",
    desc: "Limite mensal por categoria.",
    fields: [
      { name: "id", type: "String", note: "cuid(), chave primária" },
      { name: "category", type: "String", note: "Único — mesma key de Transaction.category" },
      { name: "amount", type: "Float", note: "Limite em reais" },
      { name: "createdAt", type: "DateTime", note: "Auto: now()" },
      { name: "updatedAt", type: "DateTime", note: "Auto: updatedAt" },
    ],
  },
];

const RELATIONS = [
  "Transaction  ──< TransactionTag >──  Tag",
  "Transaction.category  ──  Budget.category  (lógica, sem FK)",
];

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

export function StudioMain({ data, docs }: { data: StudioData; docs: string }) {
  const [tab, setTab] = useState<"schema" | "users" | "data" | "docs">("schema");
  const [expanded, setExpanded] = useState<string | null>("Transaction");

  const tabs = [
    { key: "schema", label: "Schema",       icon: <IconDatabase size={14} /> },
    { key: "users",  label: "Usuários",     icon: <IconUsers size={14} /> },
    { key: "data",   label: "Dados",        icon: <IconTable size={14} /> },
    { key: "docs",   label: "Documentação", icon: <IconFileDescription size={14} /> },
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
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "12px 16px", fontSize: 13, cursor: "pointer",
              background: "none", border: "none",
              color: tab === t.key ? "var(--color-f1)" : "var(--color-f3)",
              borderBottom: tab === t.key ? "2px solid var(--color-cyan)" : "2px solid transparent",
              transition: "all 150ms",
            }}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: tab === "docs" ? 0 : 28, maxWidth: tab === "docs" ? "none" : 900 }}>
        {tab === "schema" && <SchemaTab expanded={expanded} setExpanded={setExpanded} />}
        {tab === "users"  && <UsersTab users={data.users} />}
        {tab === "data"   && <DataTab data={data} />}
        {tab === "docs"   && <DocsTab content={docs} />}

      </div>
    </div>
  );
}

/* ── Schema Tab ── */
function SchemaTab({ expanded, setExpanded }: { expanded: string | null; setExpanded: (v: string | null) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Modelo de dados</div>
        <div style={{ fontSize: 13, color: "var(--color-f3)" }}>SQLite · Prisma v7 · 5 tabelas</div>
      </div>

      {/* Relations */}
      <div style={{ background: "var(--color-bg2)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "12px 16px", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "var(--color-f4)", letterSpacing: 1, marginBottom: 8 }}>RELAÇÕES</div>
        {RELATIONS.map(r => (
          <div key={r} style={{ fontFamily: "monospace", fontSize: 12, color: "var(--color-cyan)", padding: "3px 0" }}>{r}</div>
        ))}
      </div>

      {/* Tables */}
      {SCHEMA.map(s => {
        const open = expanded === s.table;
        return (
          <div key={s.table} style={{ background: "var(--color-bg2)", border: `1px solid ${open ? s.color + "44" : "var(--color-border)"}`, borderRadius: 10, overflow: "hidden", transition: "border-color 200ms" }}>
            <button
              onClick={() => setExpanded(open ? null : s.table)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
            >
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-f1)", flex: 1 }}>{s.table}</span>
              <span style={{ fontSize: 11, color: "var(--color-f4)" }}>{s.fields.length} campos</span>
              <span style={{ color: "var(--color-f4)" }}>
                {open ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
              </span>
            </button>
            {open && (
              <div style={{ borderTop: "1px solid var(--color-border)" }}>
                <div style={{ padding: "8px 16px 6px", fontSize: 12, color: "var(--color-f3)" }}>{s.desc}</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "var(--color-bg3)" }}>
                      <th style={{ padding: "6px 16px", textAlign: "left", color: "var(--color-f4)", fontWeight: 500, width: "30%" }}>Campo</th>
                      <th style={{ padding: "6px 16px", textAlign: "left", color: "var(--color-f4)", fontWeight: 500, width: "20%" }}>Tipo</th>
                      <th style={{ padding: "6px 16px", textAlign: "left", color: "var(--color-f4)", fontWeight: 500 }}>Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.fields.map((f, i) => (
                      <tr key={f.name} style={{ borderTop: "1px solid var(--color-border)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                        <td style={{ padding: "7px 16px", fontFamily: "monospace", color: s.color }}>{f.name}</td>
                        <td style={{ padding: "7px 16px", fontFamily: "monospace", color: "var(--color-f3)" }}>{f.type}</td>
                        <td style={{ padding: "7px 16px", color: "var(--color-f3)" }}>{f.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Users Tab ── */
function UsersTab({ users }: { data?: unknown; users: { id: string; name: string; email: string | null; createdAt: Date; avatar: string | null }[] }) {
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
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => { setResetId(resetId === u.id ? null : u.id); setNewPw(""); setMsg(null); setConfirmDeleteId(null); }}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", fontSize: 11, borderRadius: 6, border: "1px solid var(--color-border2)", background: "var(--color-bg3)", color: "var(--color-f2)", cursor: "pointer" }}
              >
                <IconKey size={12} /> Resetar senha
              </button>
              <button
                onClick={() => { setConfirmDeleteId(confirmDeleteId === u.id ? null : u.id); setResetId(null); setMsg(null); }}
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
type TxRow = { id: string; description: string; amount: number; type: string; category: string; date: Date };
type DataView = { txCount: number; tagCount: number; budgetCount: number; goalCount: number; recentTx: TxRow[] };

function DataTab({ data }: { data: StudioData }) {
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [filtered, setFiltered] = useState<DataView | null>(null);
  const [isLoading, startLoading] = useTransition();

  function handleUserChange(userId: string) {
    setSelectedUser(userId);
    if (userId === "all") { setFiltered(null); return; }
    startLoading(async () => {
      const result = await getStudioDataForUser(userId);
      setFiltered(result);
    });
  }

  const view: DataView = filtered ?? {
    txCount: data.txCount,
    tagCount: data.tagCount,
    budgetCount: data.budgetCount,
    goalCount: data.goalCount,
    recentTx: data.recentTx,
  };

  const stats = [
    { label: "Transações", value: view.txCount, color: "#A3E635" },
    { label: "Tags", value: view.tagCount, color: "#FBBF24" },
    { label: "Orçamentos", value: view.budgetCount, color: "#FB923C" },
    { label: "Metas", value: view.goalCount, color: "#22D3EE" },
  ];

  const selectedName = selectedUser === "all"
    ? "Todos"
    : data.users.find(u => u.id === selectedUser)?.name ?? "—";

  // format DB size
  const dbSize = (() => {
    const b = data.dbSizeBytes;
    if (b >= 1024 * 1024 * 1024) return `${(b / (1024 ** 3)).toFixed(2)} GB`;
    if (b >= 1024 * 1024)        return `${(b / (1024 ** 2)).toFixed(2)} MB`;
    if (b >= 1024)               return `${(b / 1024).toFixed(1)} KB`;
    return `${b} B`;
  })();

  return (
    <div>
      {/* Page title + filter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Visão geral dos dados</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconFilter size={13} style={{ color: "var(--color-f4)" }} />
          <UserCombobox users={data.users} value={selectedUser} onChange={handleUserChange} />
          {isLoading && <IconLoader2 size={13} style={{ color: "var(--color-f4)", animation: "spin 1s linear infinite" }} />}
        </div>
      </div>

      {/* Sistema */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "var(--color-f4)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>Sistema</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { label: "Usuários", value: data.userCount, color: "#22D3EE", sub: "contas ativas" },
            { label: "Registros totais", value: data.totalRecords.toLocaleString("pt-BR"), color: "#A78BFA", sub: "em todas as tabelas" },
            { label: "Tamanho do banco", value: dbSize, color: "#FB923C", sub: "arquivo dev.db" },
          ].map(s => (
            <div key={s.label} style={{ background: "var(--color-bg2)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontStyle: "italic", fontFamily: "var(--font-display)", color: s.color, marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--color-f2)", fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: 10, color: "var(--color-f4)", marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Usuários */}
      <div style={{ fontSize: 11, color: "var(--color-f4)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>Usuários</div>

      {selectedUser !== "all" && (
        <div style={{ fontSize: 11, color: "var(--color-cyan)", marginBottom: 14, padding: "5px 10px", borderRadius: 6, background: "rgba(34,211,238,0.06)", border: "1px solid var(--color-cyan-border)", display: "inline-block" }}>
          Filtrando por: {selectedName}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "var(--color-bg2)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 24, fontWeight: 700, fontStyle: "italic", fontFamily: "var(--font-display)", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--color-f4)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Últimas transações</div>
      {view.recentTx.length === 0 && (
        <div style={{ color: "var(--color-f4)", fontSize: 13 }}>Nenhuma transação cadastrada.</div>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        {view.recentTx.length > 0 && (
          <thead>
            <tr style={{ background: "var(--color-bg2)" }}>
              {["Data", "Descrição", "Categoria", "Tipo", "Valor"].map(h => (
                <th key={h} style={{ padding: "7px 12px", textAlign: "left", color: "var(--color-f4)", fontWeight: 500, borderBottom: "1px solid var(--color-border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {view.recentTx.map(tx => (
            <tr key={tx.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
              <td style={{ padding: "7px 12px", color: "var(--color-f3)" }}>{new Date(tx.date).toLocaleDateString("pt-BR")}</td>
              <td style={{ padding: "7px 12px", color: "var(--color-f1)" }}>{tx.description}</td>
              <td style={{ padding: "7px 12px", color: "var(--color-f3)" }}>{tx.category}</td>
              <td style={{ padding: "7px 12px" }}>
                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: tx.type === "credit" ? "rgba(163,230,53,0.1)" : "rgba(248,113,113,0.1)", color: tx.type === "credit" ? "var(--color-green)" : "var(--color-red)" }}>
                  {tx.type === "credit" ? "receita" : "despesa"}
                </span>
              </td>
              <td style={{ padding: "7px 12px", color: tx.type === "credit" ? "var(--color-green)" : "var(--color-red)", fontWeight: 500 }}>
                {tx.type === "debit" ? "-" : "+"}R$ {tx.amount.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

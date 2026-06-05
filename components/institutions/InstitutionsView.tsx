"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  createInstitution,
  updateInstitution,
  deleteInstitution,
  createAccount,
  updateAccount,
  deleteAccount,
} from "@/app/actions/institutions";
import type { Institution, Account, InstitutionType, AccountType } from "@/lib/institutions";
import { INSTITUTION_TYPE_LABELS, ACCOUNT_TYPE_LABELS } from "@/lib/institutions";
import {
  IconPlus,
  IconX,
  IconTrash,
  IconEdit,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconBuildingBank,
  IconDeviceMobile,
  IconChartBar,
  IconBuilding,
  IconWallet,
  IconPigMoney,
  IconCreditCard,
  IconTrendingUp,
  IconCash,
  IconCoin,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

// ── helpers ──────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const INST_COLORS = [
  "#22D3EE", "#4ADE80", "#F87171", "#FBBF24",
  "#A78BFA", "#FB7185", "#34D399", "#60A5FA",
];

const INST_TYPE_OPTIONS: { value: InstitutionType; label: string }[] = [
  { value: "bank", label: "Banco" },
  { value: "fintech", label: "Fintech" },
  { value: "broker", label: "Corretora" },
  { value: "other", label: "Outro" },
];

const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: "checking", label: "Conta corrente" },
  { value: "savings", label: "Poupança" },
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "investment", label: "Investimentos" },
  { value: "wallet", label: "Carteira / dinheiro" },
  { value: "other", label: "Outro" },
];

function InstitutionIcon({ type, size = 16 }: { type: string; size?: number }) {
  if (type === "bank") return <IconBuildingBank size={size} />;
  if (type === "fintech") return <IconDeviceMobile size={size} />;
  if (type === "broker") return <IconChartBar size={size} />;
  return <IconBuilding size={size} />;
}

function AccountIcon({ type, size = 14 }: { type: string; size?: number }) {
  if (type === "checking") return <IconWallet size={size} />;
  if (type === "savings") return <IconPigMoney size={size} />;
  if (type === "credit_card") return <IconCreditCard size={size} />;
  if (type === "investment") return <IconTrendingUp size={size} />;
  if (type === "wallet") return <IconCash size={size} />;
  return <IconCoin size={size} />;
}

const inputCls = "w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] px-3 h-[38px] text-[13px] text-[var(--color-f1)] outline-none focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)]";
const labelCls = "text-[11px] font-medium text-[var(--color-f2)] mb-1 block";

// ── Institution form (modal) ──────────────────────────────────────────

function InstitutionModal({
  initial,
  onClose,
}: {
  initial?: Institution;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<InstitutionType>((initial?.type as InstitutionType) ?? "bank");
  const [color, setColor] = useState(initial?.color ?? "#22D3EE");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Nome obrigatório."); return; }
    setError("");
    startTransition(async () => {
      if (initial) {
        await updateInstitution(initial.id, { name: name.trim(), type, color, notes: notes || undefined });
      } else {
        const res = await createInstitution({ name: name.trim(), type, color, icon: type, notes: notes || undefined });
        if (res?.error) { setError(res.error); return; }
      }
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--color-bg2)] border border-[var(--color-border2)] rounded-[18px] p-7 w-[440px] shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
        <div className="flex justify-between items-center mb-5">
          <span className="text-[15px] font-semibold text-[var(--color-f1)]">
            {initial ? "Editar instituição" : "Nova instituição"}
          </span>
          <button onClick={onClose} className="text-[var(--color-f4)] hover:text-[var(--color-f2)] cursor-pointer">
            <IconX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Nome</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Nubank, Itaú, XP..." autoFocus />
          </div>

          <div>
            <label className={labelCls}>Tipo</label>
            <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as InstitutionType)}>
              {INST_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Cor de identificação</label>
            <div className="flex gap-2 flex-wrap">
              {INST_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all cursor-pointer"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "#fff" : "transparent",
                    boxShadow: color === c ? `0 0 0 1px ${c}` : "none",
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Notas (opcional)</label>
            <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações livres" />
          </div>

          {error && <p className="text-[12px] text-[var(--color-red)]">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-medium bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-all cursor-pointer disabled:opacity-50"
            >
              <IconCheck size={14} />
              {isPending ? "Salvando..." : initial ? "Salvar" : "Criar"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-full text-[13px] text-[var(--color-f3)] border border-[var(--color-border2)] hover:bg-white/5 cursor-pointer">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Account form (inline inside institution card) ─────────────────────

function AccountForm({
  institutionId,
  initial,
  onClose,
}: {
  institutionId: string;
  initial?: Account;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<AccountType>((initial?.type as AccountType) ?? "checking");
  const [balance, setBalance] = useState(initial ? String(initial.balance) : "");
  const [limit, setLimit] = useState(initial?.limit != null ? String(initial.limit) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  const showLimit = type === "credit_card";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Nome obrigatório."); return; }
    setError("");
    startTransition(async () => {
      const data = {
        name: name.trim(),
        type,
        balance: Number(balance) || 0,
        limit: showLimit && limit ? Number(limit) : undefined,
        notes: notes || undefined,
      };
      if (initial) {
        await updateAccount(initial.id, data);
      } else {
        const res = await createAccount({ institutionId, ...data });
        if (res?.error) { setError(res.error); return; }
      }
      onClose();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 mb-1 p-4 bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[10px] flex flex-col gap-3"
    >
      <div className="text-[10px] font-bold tracking-[1.6px] uppercase text-[var(--color-f4)] mb-1">
        {initial ? "Editar conta" : "Nova conta"}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nome</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Conta principal" autoFocus />
        </div>
        <div>
          <label className={labelCls}>Tipo</label>
          <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as AccountType)}>
            {ACCOUNT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Saldo atual (R$)</label>
          <input className={inputCls} type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0,00" />
        </div>
        {showLimit && (
          <div>
            <label className={labelCls}>Limite do cartão (R$)</label>
            <input className={inputCls} type="number" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="0,00" />
          </div>
        )}
        <div className={showLimit ? "" : "col-span-2"}>
          <label className={labelCls}>Notas (opcional)</label>
          <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações" />
        </div>
      </div>

      {error && <p className="text-[12px] text-[var(--color-red)]">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-[7px] text-[12px] font-medium bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-all cursor-pointer disabled:opacity-50"
        >
          <IconCheck size={12} />
          {isPending ? "Salvando..." : initial ? "Salvar" : "Criar"}
        </button>
        <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-[7px] text-[12px] text-[var(--color-f3)] border border-[var(--color-border2)] hover:bg-white/5 cursor-pointer">
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ── Account row ───────────────────────────────────────────────────────

function AccountRow({
  account,
  liabilities,
}: {
  account: Account;
  liabilities: Array<{ id: string; name: string; type: string; currentBalance: number; institutionId: string | null }>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <AccountForm
        institutionId={account.institutionId}
        initial={account}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-[12px] hover:bg-white/[0.03] group/acc transition-colors">
      <AccountIcon type={account.type} size={14} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-[var(--color-f1)] truncate">{account.name}</span>
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-white/[0.06] text-[var(--color-f4)] shrink-0">
            {ACCOUNT_TYPE_LABELS[account.type as AccountType] ?? account.type}
          </span>
        </div>
        {account.limit != null && (
          <div className="text-[10px] text-[var(--color-f4)] mt-0.5">
            Limite: {fmt(account.limit)}
          </div>
        )}
        {account.notes && (
          <div className="text-[10px] text-[var(--color-f4)] mt-0.5 truncate">{account.notes}</div>
        )}
      </div>

      <div className="text-[13px] font-semibold shrink-0" style={{ color: account.balance >= 0 ? "var(--color-green)" : "var(--color-red)" }}>
        {fmt(account.balance)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover/acc:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="p-1 rounded-[5px] text-[var(--color-f4)] hover:text-[var(--color-cyan)] hover:bg-white/[0.06] cursor-pointer transition-colors"
          title="Editar"
        >
          <IconEdit size={12} />
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-1 ml-1">
            <span className="text-[10px] text-[var(--color-red)]">Excluir?</span>
            <button
              onClick={() => startTransition(async () => { await deleteAccount(account.id); })}
              disabled={isPending}
              className="px-2 py-0.5 rounded-[5px] text-[10px] bg-[var(--color-red)] text-white hover:opacity-80 cursor-pointer"
            >
              Sim
            </button>
            <button onClick={() => setConfirmDelete(false)} className="px-2 py-0.5 rounded-[5px] text-[10px] border border-[var(--color-border2)] text-[var(--color-f3)] hover:bg-white/5 cursor-pointer">
              Não
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1 rounded-[5px] text-[var(--color-f4)] hover:text-[var(--color-red)] hover:bg-[var(--color-red-dim)] cursor-pointer transition-colors"
            title="Excluir"
          >
            <IconTrash size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Institution card ──────────────────────────────────────────────────

function InstitutionCard({
  institution,
  liabilities,
  onEdit,
}: {
  institution: Institution;
  liabilities: Array<{ id: string; name: string; type: string; currentBalance: number; institutionId: string | null }>;
  onEdit: (inst: Institution) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [addingAccount, setAddingAccount] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const linkedLiabilities = liabilities.filter((l) => l.institutionId === institution.id);
  const totalBalance = institution.accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[14px] overflow-hidden">
      {/* Card header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Color dot + icon */}
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: institution.color + "20", color: institution.color }}
        >
          <InstitutionIcon type={institution.type} size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold text-[var(--color-f1)]">{institution.name}</span>
            <span className="text-[9px] font-bold tracking-[1px] uppercase px-1.5 py-0.5 rounded-[4px] text-[var(--color-f4)]"
              style={{ background: institution.color + "18", color: institution.color }}>
              {INSTITUTION_TYPE_LABELS[institution.type as InstitutionType] ?? institution.type}
            </span>
          </div>
          <div className="text-[11px] text-[var(--color-f4)] mt-0.5">
            {institution.accounts.length} conta{institution.accounts.length !== 1 ? "s" : ""}
            {linkedLiabilities.length > 0 && ` · ${linkedLiabilities.length} serviço${linkedLiabilities.length !== 1 ? "s" : ""} vinculado${linkedLiabilities.length !== 1 ? "s" : ""}`}
          </div>
        </div>

        <div className="text-right shrink-0 mr-2">
          <div className="text-[13px] font-semibold" style={{ color: totalBalance >= 0 ? "var(--color-green)" : "var(--color-red)" }}>
            {fmt(totalBalance)}
          </div>
          <div className="text-[9px] text-[var(--color-f4)]">saldo total</div>
        </div>

        {/* Edit + delete */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(institution)}
            className="p-1.5 rounded-[7px] text-[var(--color-f4)] hover:text-[var(--color-cyan)] hover:bg-white/[0.06] cursor-pointer transition-colors"
          >
            <IconEdit size={13} />
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1 ml-1">
              <span className="text-[10px] text-[var(--color-red)]">Excluir tudo?</span>
              <button
                onClick={() => startTransition(async () => { await deleteInstitution(institution.id); })}
                disabled={isPending}
                className="px-2 py-0.5 rounded-[5px] text-[10px] bg-[var(--color-red)] text-white hover:opacity-80 cursor-pointer"
              >
                Sim
              </button>
              <button onClick={() => setConfirmDelete(false)} className="px-2 py-0.5 rounded-[5px] text-[10px] border border-[var(--color-border2)] text-[var(--color-f3)] hover:bg-white/5 cursor-pointer">
                Não
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-[7px] text-[var(--color-f4)] hover:text-[var(--color-red)] hover:bg-[var(--color-red-dim)] cursor-pointer transition-colors"
            >
              <IconTrash size={13} />
            </button>
          )}
        </div>

        <div className="text-[var(--color-f4)] shrink-0">
          {expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        </div>
      </div>

      {/* Card body */}
      {expanded && (
        <div className="border-t border-[var(--color-border)] px-4 py-3">

          {/* Accounts */}
          <div className="mb-3">
            <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-[var(--color-f4)] mb-2 px-1">
              Contas
            </div>
            {institution.accounts.length === 0 && !addingAccount && (
              <p className="text-[12px] text-[var(--color-f4)] px-3 py-2">Nenhuma conta cadastrada.</p>
            )}
            {institution.accounts.map((acc) => (
              <AccountRow key={acc.id} account={acc} liabilities={linkedLiabilities} />
            ))}
            {addingAccount ? (
              <AccountForm
                institutionId={institution.id}
                onClose={() => setAddingAccount(false)}
              />
            ) : (
              <button
                onClick={() => setAddingAccount(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 mt-1 rounded-[7px] text-[11px] text-[var(--color-f4)] hover:text-[var(--color-cyan)] hover:bg-white/[0.04] border border-dashed border-[var(--color-border2)] hover:border-[var(--color-cyan-border)] transition-all cursor-pointer w-full"
              >
                <IconPlus size={12} />
                Adicionar conta
              </button>
            )}
          </div>

          {/* Linked liabilities */}
          {linkedLiabilities.length > 0 && (
            <div className="mt-3 border-t border-[var(--color-border)] pt-3">
              <div className="text-[10px] font-bold tracking-[1.5px] uppercase text-[var(--color-f4)] mb-2 px-1">
                Serviços vinculados
              </div>
              {linkedLiabilities.map((l) => (
                <div key={l.id} className="flex items-center gap-3 py-2 px-3 rounded-[12px] hover:bg-white/[0.03] transition-colors">
                  <IconAlertTriangle size={13} className="text-[var(--color-amber)] shrink-0" />
                  <span className="text-[12px] text-[var(--color-f2)] flex-1 truncate">{l.name}</span>
                  <span className="text-[10px] text-[var(--color-f4)] shrink-0">{l.type.replace("_", " ")}</span>
                  <span className="text-[12px] font-medium text-[var(--color-red)] shrink-0">{fmt(l.currentBalance)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────

interface Props {
  institutions: Institution[];
  liabilities: Array<{ id: string; name: string; type: string; currentBalance: number; institutionId: string | null }>;
}

export function InstitutionsView({ institutions, liabilities }: Props) {
  const [modal, setModal] = useState<"create" | Institution | null>(null);

  const totalAccounts = institutions.reduce((s, i) => s + i.accounts.length, 0);
  const totalBalance = institutions.reduce((s, i) => s + i.accounts.reduce((a, acc) => a + acc.balance, 0), 0);
  const linkedServices = liabilities.filter((l) => l.institutionId !== null).length;

  return (
    <div className="p-8 max-w-[860px]">
      {/* Header */}
      <div className="text-[9px] font-bold tracking-[2.5px] uppercase text-[var(--color-cyan)] mb-2.5 flex items-center gap-2 after:content-[''] after:w-8 after:h-px after:bg-[var(--color-cyan-border)]">
        Patrimônio e serviços
      </div>
      <div className="flex items-end justify-between mb-2">
        <h1 className="font-[family-name:var(--font-display)] italic text-[36px] font-bold tracking-tight text-[var(--color-f1)] leading-tight">
          Institui<span className="text-[var(--color-cyan)]">ções</span>
        </h1>
        <button
          onClick={() => setModal("create")}
          className="flex items-center gap-2 px-4 py-2 rounded-[9px] text-[13px] font-medium bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-all cursor-pointer mb-1"
        >
          <IconPlus size={14} />
          Nova instituição
        </button>
      </div>
      <p className="text-[var(--color-f3)] text-sm mb-8">
        Bancos, fintechs e corretoras. Acompanhe saldos e serviços contratados em cada uma.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Instituições", value: String(institutions.length) },
          {
            label: "Saldo total",
            value: fmt(totalBalance),
            colored: true,
            positive: totalBalance >= 0,
          },
          { label: "Serviços vinculados", value: String(linkedServices) },
        ].map(({ label, value, colored, positive }) => (
          <div key={label} className="bg-[var(--color-bg2)] border border-[var(--color-border)] rounded-[12px] p-4">
            <div className="text-[10px] font-semibold tracking-[1.2px] uppercase text-[var(--color-f4)] mb-1">{label}</div>
            <div
              className="text-[20px] font-bold font-[family-name:var(--font-display)] italic"
              style={{ color: colored ? (positive ? "var(--color-green)" : "var(--color-red)") : "var(--color-f1)" }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Institution list */}
      {institutions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <IconBuildingBank size={40} className="text-[var(--color-f4)] mb-4" />
          <div className="text-[14px] font-medium text-[var(--color-f3)] mb-1">Nenhuma instituição cadastrada</div>
          <div className="text-[12px] text-[var(--color-f4)] mb-5">Adicione seu banco, fintech ou corretora para começar a organizar.</div>
          <button
            onClick={() => setModal("create")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[9px] text-[13px] font-medium bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-all cursor-pointer"
          >
            <IconPlus size={14} />
            Adicionar instituição
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {institutions.map((inst) => (
            <InstitutionCard
              key={inst.id}
              institution={inst}
              liabilities={liabilities}
              onEdit={(i) => setModal(i)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modal === "create" && (
        <InstitutionModal onClose={() => setModal(null)} />
      )}
      {modal && modal !== "create" && (
        <InstitutionModal initial={modal as Institution} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

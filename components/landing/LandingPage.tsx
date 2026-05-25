"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconChevronDown, IconChevronRight,
  IconArrowRight, IconSparkles,
  IconLayoutDashboard, IconHeartRateMonitor,
  IconBook2, IconAlertTriangle, IconBuildingBank, IconCreditCard,
} from "@tabler/icons-react";

/* ── Marquee ── */
const MARQUEE_ITEMS = [
  "DRE Pessoal", "Score de Saúde", "Educação Financeira", "Streak Semanal",
  "Alertas Proativos", "Passivos & Avalanche", "Bens & Imóveis", "Orçamento Inteligente",
  "Lyfx", "Life Fixed", "Contas Fixas", "Metas Financeiras", "Instituições",
];

function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)", padding: "14px 0", background: "var(--color-bg2)" }}>
      <div style={{ display: "flex", gap: 0, animation: "marquee 36s linear infinite", width: "max-content" }}>
        {items.map((item, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 28, paddingRight: 28, fontSize: 12, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--color-f3)", whiteSpace: "nowrap" }}>
            {item}
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--color-cyan)", display: "inline-block", flexShrink: 0 }} />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Dashboard mockup ── */
function DashboardMockup() {
  const bars = [55, 80, 45, 90, 62, 75, 40];
  const months = ["Nov", "Dez", "Jan", "Fev", "Mar", "Abr", "Mai"];
  return (
    <div style={{
      background: "var(--color-bg2)", border: "1px solid var(--color-border2)",
      borderRadius: 16, padding: 20, width: "100%", maxWidth: 480,
      boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Maio 2026</div>
        <div style={{ fontSize: 10, padding: "3px 10px", borderRadius: 999, background: "rgba(163,230,53,0.1)", color: "var(--color-green)", border: "1px solid rgba(163,230,53,0.2)" }}>+12% vs mês anterior</div>
      </div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
        {[
          { label: "Receita", value: "R$ 8.400", color: "var(--color-green)" },
          { label: "Despesas", value: "R$ 5.210", color: "var(--color-red)" },
          { label: "Resultado", value: "R$ 3.190", color: "var(--color-cyan)" },
        ].map(k => (
          <div key={k.label} style={{ background: "var(--color-bg3)", borderRadius: 10, padding: "10px 12px", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: 10, color: "var(--color-f4)", marginBottom: 4, letterSpacing: "0.5px" }}>{k.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, fontStyle: "italic", fontFamily: "var(--font-display)", color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>
      {/* Health score widget */}
      <div style={{ background: "var(--color-bg3)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--color-border)", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: "var(--color-f4)", letterSpacing: "0.5px" }}>SAÚDE FINANCEIRA</span>
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(34,211,238,0.1)", color: "var(--color-cyan)", border: "1px solid rgba(34,211,238,0.2)" }}>Estável</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, fontWeight: 700, color: "var(--color-cyan)" }}>74</div>
          <div style={{ flex: 1 }}>
            {[
              { label: "Comprometimento", pct: 68, color: "#FBBF24" },
              { label: "Poupança", pct: 82, color: "#A3E635" },
            ].map(d => (
              <div key={d.label} style={{ marginBottom: 5 }}>
                <div style={{ height: 3, background: "var(--color-bg5)", borderRadius: 999 }}>
                  <div style={{ height: "100%", width: `${d.pct}%`, background: d.color, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Bar chart */}
      <div>
        <div style={{ fontSize: 10, color: "var(--color-f4)", marginBottom: 10, letterSpacing: "0.5px" }}>HISTÓRICO</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 50 }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{
                width: "100%", height: `${h}%`, borderRadius: 4,
                background: i === 6
                  ? "var(--color-cyan)"
                  : `rgba(34,211,238,${0.15 + i * 0.04})`,
                minHeight: 4,
              }} />
              <span style={{ fontSize: 9, color: "var(--color-f4)" }}>{months[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Features ── */
const FEATURES = [
  {
    icon: <IconLayoutDashboard size={20} />,
    title: "DRE Pessoal",
    desc: "Cada real categorizado com semântica precisa — fixo, variável, comprometido, sazonal. Não apenas quanto você gastou, mas qual tipo de gasto foi.",
    color: "#22D3EE",
    mockup: (
      <div style={{ padding: "16px 0 4px" }}>
        {[
          { label: "Receita fixa", val: "R$ 6.000", pct: 100, color: "#A3E635" },
          { label: "Desp. comprometida", val: "R$ 2.100", pct: 35, color: "#F87171" },
          { label: "Desp. variável", val: "R$ 1.840", pct: 30, color: "#FB923C" },
          { label: "Investimento", val: "R$ 800", pct: 13, color: "#22D3EE" },
        ].map(r => (
          <div key={r.label} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: "var(--color-f3)" }}>{r.label}</span>
              <span style={{ color: "var(--color-f2)", fontWeight: 500 }}>{r.val}</span>
            </div>
            <div style={{ height: 4, background: "var(--color-bg5)", borderRadius: 999 }}>
              <div style={{ height: "100%", width: `${r.pct}%`, background: r.color, borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: <IconHeartRateMonitor size={20} />,
    title: "Score de Saúde",
    desc: "4 dimensões analisadas em tempo real: comprometimento da renda, taxa de poupança, resultado mensal e fundo de reserva. Um número, um diagnóstico.",
    color: "#A3E635",
    mockup: (
      <div style={{ padding: "16px 0 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 40, fontWeight: 700, color: "#A3E635", lineHeight: 1 }}>74</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#A3E635", marginBottom: 2 }}>Estável</div>
            <div style={{ fontSize: 11, color: "var(--color-f4)" }}>Bom desempenho geral</div>
          </div>
        </div>
        {[
          { label: "Comprometimento", val: "68%", color: "#FBBF24", pct: 68 },
          { label: "Poupança", val: "19%", color: "#A3E635", pct: 82 },
          { label: "Resultado", val: "38%", color: "#A3E635", pct: 78 },
          { label: "Reserva", val: "3 meses", color: "#22D3EE", pct: 60 },
        ].map(d => (
          <div key={d.label} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
              <span style={{ color: "var(--color-f3)" }}>{d.label}</span>
              <span style={{ color: d.color, fontWeight: 500 }}>{d.val}</span>
            </div>
            <div style={{ height: 3, background: "var(--color-bg5)", borderRadius: 999 }}>
              <div style={{ height: "100%", width: `${d.pct}%`, background: d.color, borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: <IconBook2 size={20} />,
    title: "Educação Financeira",
    desc: "85 pílulas pedagógicas adaptadas ao seu perfil de saúde financeira. Quiz de fixação, streak semanal e trilhas que evoluem conforme você melhora.",
    color: "#A78BFA",
    mockup: (
      <div style={{ padding: "16px 0 4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "var(--color-f4)" }}>Trilha <span style={{ color: "#A78BFA" }}>Estável</span></div>
          <div style={{ display: "flex", gap: 3 }}>
            {[1,1,1,1,1,1,0,0,0,0,0,0].map((w, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: w ? "#A78BFA" : "var(--color-bg5)" }} />
            ))}
          </div>
        </div>
        {[
          { title: "Fundo de emergência", done: true },
          { title: "Custo de vida vs renda", done: true },
          { title: "Investimento inicial", done: false },
        ].map(p => (
          <div key={p.title} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ width: 18, height: 18, borderRadius: 999, flexShrink: 0, background: p.done ? "#A78BFA22" : "var(--color-bg5)", border: `1px solid ${p.done ? "#A78BFA" : "var(--color-border)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {p.done && <div style={{ width: 8, height: 8, borderRadius: 999, background: "#A78BFA" }} />}
            </div>
            <span style={{ fontSize: 12, color: p.done ? "var(--color-f3)" : "var(--color-f2)" }}>{p.title}</span>
          </div>
        ))}
        <div style={{ marginTop: 10, fontSize: 11, color: "var(--color-f4)" }}>🔥 Streak: <span style={{ color: "#A78BFA", fontWeight: 600 }}>4 semanas</span></div>
      </div>
    ),
  },
  {
    icon: <IconAlertTriangle size={20} />,
    title: "Alertas Proativos",
    desc: "O sistema trabalha por você. Alertas de orçamento estourado, metas comprometidas, passivos com taxa crítica e projeções negativas — antes de virar problema.",
    color: "#FB923C",
    mockup: (
      <div style={{ padding: "16px 0 4px", display: "flex", flexDirection: "column", gap: 7 }}>
        {[
          { type: "danger", icon: "🔴", msg: "Cheque especial ativo · 12% a.m.", sub: "Equivale a 290% a.a." },
          { type: "warning", icon: "🟡", msg: "Orçamento de Lazer a 130%", sub: "R$ 520 de R$ 400 limite" },
          { type: "info", icon: "🔵", msg: "IPVA vence em 18 dias", sub: "R$ 1.240 — provisão ok" },
        ].map(a => (
          <div key={a.msg} style={{
            padding: "9px 12px", borderRadius: 10,
            background: a.type === "danger" ? "rgba(248,113,113,0.07)" : a.type === "warning" ? "rgba(251,191,36,0.07)" : "rgba(34,211,238,0.07)",
            border: `1px solid ${a.type === "danger" ? "rgba(248,113,113,0.2)" : a.type === "warning" ? "rgba(251,191,36,0.2)" : "rgba(34,211,238,0.2)"}`,
          }}>
            <div style={{ fontSize: 12, color: "var(--color-f2)", marginBottom: 2 }}>{a.icon} {a.msg}</div>
            <div style={{ fontSize: 10, color: "var(--color-f4)" }}>{a.sub}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: <IconCreditCard size={20} />,
    title: "Passivos & Dívidas",
    desc: "Registre todas as dívidas, visualize o custo real de cada uma e use o método avalanche para quitar com o mínimo de juros possível.",
    color: "#F87171",
    mockup: (
      <div style={{ padding: "16px 0 4px" }}>
        {[
          { name: "Cartão Nubank", rate: "12,9% a.m.", balance: "R$ 3.200", color: "#F87171" },
          { name: "Financiamento", rate: "1,2% a.m.", balance: "R$ 22.400", color: "#FBBF24" },
          { name: "Empréstimo", rate: "3,5% a.m.", balance: "R$ 8.000", color: "#FB923C" },
        ].map(l => (
          <div key={l.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--color-f2)" }}>{l.name}</div>
              <div style={{ fontSize: 10, color: l.color }}>{l.rate}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-f1)" }}>{l.balance}</div>
          </div>
        ))}
        <div style={{ marginTop: 10, fontSize: 11, color: "var(--color-f4)" }}>
          Método avalanche: <span style={{ color: "#22D3EE" }}>economize R$ 1.840 em juros</span>
        </div>
      </div>
    ),
  },
  {
    icon: <IconBuildingBank size={20} />,
    title: "Bens & Imóveis",
    desc: "Cadastre imóveis, veículos e outros bens. Vincule despesas associadas como IPTU, IPVA, seguro e manutenção. Visão completa do seu patrimônio.",
    color: "#FBBF24",
    mockup: (
      <div style={{ padding: "16px 0 4px", display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { name: "Apartamento SP", type: "Imóvel", val: "R$ 420.000", badge: "IPTU pendente", badgeColor: "#F87171" },
          { name: "Honda Civic 2022", type: "Veículo", val: "R$ 98.000", badge: "IPVA pago", badgeColor: "#A3E635" },
          { name: "Previdência", type: "Outro bem", val: "R$ 34.500", badge: "Em dia", badgeColor: "#22D3EE" },
        ].map(a => (
          <div key={a.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "var(--color-bg3)", borderRadius: 8, border: "1px solid var(--color-border)" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--color-f2)" }}>{a.name}</div>
              <div style={{ fontSize: 10, color: "var(--color-f4)" }}>{a.type}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-f1)" }}>{a.val}</div>
              <div style={{ fontSize: 10, color: a.badgeColor }}>{a.badge}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

/* ── FAQ ── */
const FAQ_ITEMS = [
  {
    q: "O que é o score de saúde financeira?",
    a: "É um diagnóstico calculado em 4 dimensões: comprometimento da renda (% gasta em fixos), taxa de poupança, resultado mensal e cobertura do fundo de reserva. O resultado é um número de 0 a 100 com um perfil — de Crítico a Saudável — que orienta o que focar primeiro.",
  },
  {
    q: "Como funciona a Educação Financeira?",
    a: "O módulo identifica seu perfil de saúde financeira e sugere pílulas pedagógicas específicas para ele. Cada pílula tem conteúdo explicativo e um quiz de fixação. Há um sistema de streak semanal para manter consistência no aprendizado.",
  },
  {
    q: "O Lyfx é gratuito?",
    a: "Sim. Você pode criar sua conta e começar a usar agora, sem cartão de crédito e sem compromisso.",
  },
  {
    q: "Meus dados financeiros ficam seguros?",
    a: "Seus dados são armazenados localmente com isolamento completo por usuário. Toda query exige autenticação. Privacidade é uma prioridade no Lyfx.",
  },
  {
    q: "O que é o método avalanche de dívidas?",
    a: "É a estratégia matematicamente ótima para quitar dívidas: pague o mínimo em todas e coloque o máximo na dívida com a maior taxa de juros. O Lyfx calcula automaticamente quanto você economizaria comparado ao pagamento mínimo.",
  },
  {
    q: "É possível importar dados bancários?",
    a: "Em breve. Estamos desenvolvendo importação de extratos em OFX e CSV para lançamento semi-automático de transações.",
  },
  {
    q: "O que é uma DRE pessoal?",
    a: "DRE (Demonstração do Resultado do Exercício) é o relatório que empresas usam para entender receitas e despesas. O Lyfx traz essa mesma estrutura para as finanças pessoais — cada real vai para uma categoria com semântica precisa, revelando não apenas quanto você gastou, mas qual tipo de gasto foi.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid var(--color-border)" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 16 }}
      >
        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--color-f1)" }}>{q}</span>
        <span style={{ color: "var(--color-f4)", flexShrink: 0, transition: "transform 200ms", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          <IconChevronDown size={16} />
        </span>
      </button>
      {open && (
        <p style={{ fontSize: 14, color: "var(--color-f3)", lineHeight: 1.75, paddingBottom: 20, margin: 0 }}>{a}</p>
      )}
    </div>
  );
}

/* ── StepCard ── */
function StepCard({ step, title, desc, color, isLast }: { step: string; title: string; desc: string; color: string; isLast: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        padding: "28px 20px",
        borderRadius: 14,
        border: `1px solid ${hovered ? color : "var(--color-border)"}`,
        background: hovered ? color : "var(--color-bg3)",
        transition: "background 0.25s ease, border-color 0.25s ease",
        cursor: "default",
        overflow: "hidden",
      }}
    >
      {/* número */}
      <div style={{
        fontFamily: "var(--font-display)",
        fontStyle: "italic",
        fontSize: 36,
        fontWeight: 700,
        color: hovered ? "rgba(0,0,0,0.2)" : color,
        opacity: hovered ? 1 : 0.35,
        lineHeight: 1,
        marginBottom: 12,
        transition: "color 0.25s ease, opacity 0.25s ease",
      }}>{step}</div>

      {/* título */}
      <div style={{
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 8,
        color: hovered ? "#000" : color,
        transition: "color 0.25s ease",
      }}>{title}</div>

      {/* descrição */}
      <div style={{
        fontSize: 12,
        lineHeight: 1.7,
        color: hovered ? "rgba(0,0,0,0.65)" : "var(--color-f3)",
        transition: "color 0.25s ease",
      }}>{desc}</div>

      {/* seta — aparece no hover, oculta no último card */}
      {!isLast && (
        <div style={{
          position: "absolute",
          right: 12,
          bottom: 12,
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateX(0)" : "translateX(-6px)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
          color: "rgba(0,0,0,0.4)",
        }}>
          <IconChevronRight size={20} />
        </div>
      )}
    </div>
  );
}

/* ── Main ── */
export function LandingPage() {
  return (
    <div style={{ background: "var(--color-bg)", color: "var(--color-f1)", fontFamily: "var(--font-body)", overflowX: "hidden" }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: 60,
        background: "rgba(12,12,12,0.85)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--color-border)",
      }}>
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: 22, letterSpacing: "-0.5px" }}>
          Ly<span style={{ color: "var(--color-cyan)" }}>fx</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {["Funcionalidades", "Como funciona", "FAQ"].map(item => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
              style={{ fontSize: 13, color: "var(--color-f3)", textDecoration: "none", transition: "color 150ms" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--color-f1)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--color-f3)")}
            >
              {item}
            </a>
          ))}
        </div>
        <Link
          href="/login"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 600,
            background: "var(--color-cyan)", color: "#083344",
            padding: "8px 18px", borderRadius: 8,
            textDecoration: "none", transition: "opacity 150ms",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          Entrar <IconArrowRight size={14} />
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: "100px 48px 80px", maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 999, border: "1px solid var(--color-cyan-border)", background: "var(--color-cyan-faint)", fontSize: 11, color: "var(--color-cyan)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 32, animation: "fadeUp 0.5s ease both" }}
        >
          <IconSparkles size={12} /> Diagnóstico · Controle · Educação
        </div>

        <h1 style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700,
          fontSize: "clamp(42px, 7vw, 80px)", textAlign: "center",
          letterSpacing: "-2px", lineHeight: 1.1, marginBottom: 24,
          animation: "fadeUp 0.55s 0.05s ease both",
        }}>
          Sua vida financeira.<br />
          <span style={{ color: "var(--color-cyan)" }}>Diagnosticada.</span>
        </h1>

        <p style={{
          fontSize: "clamp(15px, 2vw, 18px)", color: "var(--color-f3)", textAlign: "center",
          maxWidth: 560, lineHeight: 1.75, marginBottom: 40,
          animation: "fadeUp 0.55s 0.1s ease both",
        }}>
          DRE pessoal, score de saúde financeira em 4 dimensões, educação adaptada ao seu perfil e alertas proativos. Não só controle — diagnóstico.
        </p>

        <div style={{ display: "flex", gap: 12, marginBottom: 72, animation: "fadeUp 0.55s 0.15s ease both" }}>
          <Link
            href="/login"
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "12px 28px",
              background: "var(--color-cyan)", color: "#083344",
              borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none",
              transition: "opacity 150ms",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Acessar o Lyfx <IconArrowRight size={15} />
          </Link>
          <a
            href="#como-funciona"
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "12px 24px",
              background: "transparent", color: "var(--color-f2)",
              border: "1px solid var(--color-border2)", borderRadius: 10,
              fontSize: 14, textDecoration: "none", transition: "all 150ms",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "var(--color-f1)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border2)"; e.currentTarget.style.color = "var(--color-f2)"; }}
          >
            Ver como funciona
          </a>
        </div>

        {/* Hero mockup */}
        <div style={{ animation: "fadeUp 0.7s 0.2s ease both", width: "100%", display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute", inset: -1,
              background: "linear-gradient(135deg, rgba(34,211,238,0.15), transparent 60%)",
              borderRadius: 18, filter: "blur(20px)",
            }} />
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ── Marquee ── */}
      <Marquee />

      {/* ── Features ── */}
      <section id="funcionalidades" style={{ padding: "96px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 14 }}>Funcionalidades</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: "clamp(28px, 4vw, 42px)", letterSpacing: "-1px", lineHeight: 1.2 }}>
            Mais que controle.<br />
            <span style={{ color: "var(--color-cyan)" }}>Inteligência financeira.</span>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {FEATURES.map(f => (
            <div
              key={f.title}
              style={{
                background: "var(--color-bg2)", border: "1px solid var(--color-border)",
                borderRadius: 16, padding: 24,
                transition: "border-color 200ms, transform 200ms",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = f.color + "44";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, background: f.color + "16", border: `1px solid ${f.color}33`, display: "flex", alignItems: "center", justifyContent: "center", color: f.color }}>
                  {f.icon}
                </span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{f.title}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--color-f3)", lineHeight: 1.75, marginBottom: 0 }}>{f.desc}</p>
              {f.mockup}
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="como-funciona" style={{ padding: "96px 48px", background: "var(--color-bg2)", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 14 }}>Como funciona</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-1px", marginBottom: 56 }}>
            Do lançamento ao diagnóstico.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { step: "01", title: "Crie sua conta", desc: "Sem cartão, sem burocracia. Só você e sua conta.", color: "#22D3EE" },
              { step: "02", title: "Lance transações", desc: "Receitas, despesas, parcelas e recorrências. Tudo categorizado.", color: "#A3E635" },
              { step: "03", title: "Veja seu score", desc: "4 dimensões analisadas. Um diagnóstico claro da sua saúde financeira.", color: "#A78BFA" },
              { step: "04", title: "Evolua com pílulas", desc: "Educação adaptada ao seu perfil. Aprenda o que você mais precisa.", color: "#FBBF24" },
            ].map((s, i) => <StepCard key={s.step} {...s} isLast={i === 3} />)}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "96px 48px", maxWidth: 700, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 14 }}>FAQ</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-1px" }}>
            Dúvidas frequentes.
          </h2>
        </div>
        <div>
          {FAQ_ITEMS.map(item => <FAQItem key={item.q} {...item} />)}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: "80px 48px 96px", textAlign: "center", borderTop: "1px solid var(--color-border)" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: "-1.5px", lineHeight: 1.15, marginBottom: 20 }}>
            Sua equação<br />
            <span style={{ color: "var(--color-cyan)" }}>tem solução.</span>
          </h2>
          <p style={{ fontSize: 15, color: "var(--color-f3)", lineHeight: 1.75, marginBottom: 36 }}>
            Comece agora. É grátis, leva menos de um minuto e vai mudar a forma como você enxerga suas finanças.
          </p>
          <Link
            href="/login"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 36px", background: "var(--color-cyan)", color: "#083344",
              borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: "none",
              transition: "opacity 150ms",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Acessar o Lyfx <IconArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--color-border)", padding: "28px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: 18 }}>
          Ly<span style={{ color: "var(--color-cyan)" }}>fx</span>
          <span style={{ fontFamily: "var(--font-body)", fontStyle: "normal", fontSize: 11, color: "var(--color-f4)", marginLeft: 8, letterSpacing: "1px" }}>LIFE FIXED</span>
        </div>
        <div style={{ fontSize: 11, color: "var(--color-f4)" }}>v1.5.0 · © 2026 Lyfx. Todos os direitos reservados.</div>
      </footer>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

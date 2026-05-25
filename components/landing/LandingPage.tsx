"use client";

import { useState, useEffect } from "react";
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
    desc: "Cada real categorizado com semântica precisa, fixo, variável, comprometido, sazonal. Não apenas quanto você gastou, mas qual tipo de gasto foi.",
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
    desc: "O sistema trabalha por você. Alertas de orçamento estourado, metas comprometidas, passivos com taxa crítica e projeções negativas, antes de virar problema.",
    color: "#FB923C",
    mockup: (
      <div style={{ padding: "16px 0 4px", display: "flex", flexDirection: "column", gap: 7 }}>
        {[
          { type: "danger", icon: "🔴", msg: "Cheque especial ativo · 12% a.m.", sub: "Equivale a 290% a.a." },
          { type: "warning", icon: "🟡", msg: "Orçamento de Lazer a 130%", sub: "R$ 520 de R$ 400 limite" },
          { type: "info", icon: "🔵", msg: "IPVA vence em 18 dias", sub: "R$ 1.240, provisão ok" },
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
    a: "É um diagnóstico calculado em 4 dimensões: comprometimento da renda (% gasta em fixos), taxa de poupança, resultado mensal e cobertura do fundo de reserva. O resultado é um número de 0 a 100 com um perfil, de Crítico a Saudável, que orienta o que focar primeiro.",
  },
  {
    q: "Como funciona a Educação Financeira?",
    a: "O módulo identifica seu perfil de saúde financeira e sugere pílulas pedagógicas específicas para ele. Cada pílula tem conteúdo explicativo e um quiz de fixação. Há um sistema de streak semanal para manter consistência no aprendizado.",
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
    a: "DRE (Demonstração do Resultado do Exercício) é o relatório que empresas usam para entender receitas e despesas. O Lyfx traz essa mesma estrutura para as finanças pessoais, cada real vai para uma categoria com semântica precisa, revelando não apenas quanto você gastou, mas qual tipo de gasto foi.",
  },
];

function FAQItem({ q, a, index, open, onToggle }: { q: string; a: string; index: number; open: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        borderRadius: 14,
        /* padding fixo — nunca muda, nada se move */
        padding: "18px 20px",
        marginBottom: 4,
        background: open ? "rgba(34,211,238,0.06)" : hovered ? "rgba(34,211,238,0.025)" : "transparent",
        /* borda sempre presente (1px), só a cor muda — sem layout shift */
        border: "1px solid transparent",
        borderBottom: open
          ? "1px solid rgba(34,211,238,0.22)"
          : "1px solid var(--color-border)",
        outline: open ? "1px solid rgba(34,211,238,0.22)" : "1px solid transparent",
        transition: "background 0.2s ease, border-color 0.2s ease, outline-color 0.2s ease",
      }}
    >
      {/* Linha principal — padding zero, o pai já cuida */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>

        <span style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700,
          fontSize: 18, lineHeight: 1,
          color: "var(--color-cyan)",
          opacity: open ? 0.7 : hovered ? 0.5 : 0.35,
          flexShrink: 0, width: 28,
          transition: "opacity 0.2s",
        }}>
          {String(index + 1).padStart(2, "0")}
        </span>

        <span style={{
          fontSize: 15, fontWeight: 500, flex: 1,
          color: open || hovered ? "var(--color-f1)" : "var(--color-f2)",
          transition: "color 0.2s",
        }}>
          {q}
        </span>

        <span style={{
          flexShrink: 0,
          color: open || hovered ? "var(--color-cyan)" : "var(--color-f4)",
          transform: open ? "rotate(90deg)" : hovered ? "rotate(0deg)" : "rotate(-45deg)",
          transition: "color 0.2s, transform 0.22s ease",
          display: "flex",
        }}>
          <IconArrowRight size={16} />
        </span>
      </div>

      {/* Resposta */}
      {open && (
        <p style={{
          fontSize: 14, color: "var(--color-f3)", lineHeight: 1.75,
          margin: "14px 0 0 48px",
        }}>
          {a}
        </p>
      )}
    </div>
  );
}

/* ── StepCard ── */
function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
        background: hovered ? hexToRgba(color, 0.12) : "var(--color-bg3)",
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
        color: color,
        opacity: hovered ? 0.6 : 0.35,
        lineHeight: 1,
        marginBottom: 12,
        transition: "opacity 0.25s ease",
      }}>{step}</div>

      {/* título */}
      <div style={{
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 8,
        color: color,
        transition: "color 0.25s ease",
      }}>{title}</div>

      {/* descrição */}
      <div style={{
        fontSize: 12,
        lineHeight: 1.7,
        color: hovered ? "var(--color-f2)" : "var(--color-f3)",
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
          color: color,
        }}>
          <IconChevronRight size={20} />
        </div>
      )}
    </div>
  );
}

/* ── FAQ List ── */
function FAQList() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <>
      {FAQ_ITEMS.map((item, i) => (
        <FAQItem
          key={item.q} {...item} index={i}
          open={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        />
      ))}
    </>
  );
}

/* ── Main ── */
export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{
      background: "var(--color-bg)",
      backgroundImage: "radial-gradient(circle, rgba(34,211,238,0.09) 1px, transparent 1px)",
      backgroundSize: "32px 32px",
      color: "var(--color-f1)", fontFamily: "var(--font-body)", overflowX: "hidden",
    }}>

      <style>{`
        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .hero-text { align-items: center !important; }
          .hero-ctas { justify-content: center !important; }
        }
      `}</style>

      {/* ── Navbar wrapper ── */}
      <div style={{
        position: "fixed", top: 12, left: 16, right: 16, zIndex: 50, borderRadius: 32,
        background: "rgba(255,255,255,0.06)", /* borda estática sempre presente */
      }}>

        {/* Camada do cometa — faz fade-in sobre a borda estática */}
        <div
          className={scrolled ? "nav-comet-border" : ""}
          style={{
            position: "absolute", inset: 0, borderRadius: 32, padding: 1,
            pointerEvents: "none",
            opacity: scrolled ? 1 : 0,
            transition: "opacity 0.6s ease",
          }}
        />

        {/* ── Navbar — margin:1 abre espaço para a borda; glassmorphism intacto ── */}
        <nav style={{
          position: "relative",
          margin: 1,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 0 0 28px", height: 50,
          borderRadius: 31,
          background: scrolled ? "rgba(10,10,10,0.82)" : "rgba(18,18,18,0.5)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          transition: "background 0.3s ease",
        }}>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: 22, letterSpacing: "-0.5px", background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--color-f1)" }}
        >
          Ly<span style={{ color: "var(--color-cyan)" }}>fx</span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {[
            { label: "Sobre",           anchor: "sobre" },
            { label: "Funcionalidades", anchor: "funcionalidades" },
            { label: "Como funciona",   anchor: "como-funciona" },
            { label: "Preços",          anchor: "precos" },
            { label: "FAQ",             anchor: "faq" },
          ].map(item => (
            <a
              key={item.label}
              href={`#${item.anchor}`}
              style={{ fontSize: 13, color: "var(--color-f3)", textDecoration: "none", transition: "color 150ms, text-decoration-color 150ms" }}
              onMouseEnter={e => {
                e.currentTarget.style.color = "var(--color-f1)";
                e.currentTarget.style.textDecoration = "underline";
                e.currentTarget.style.textDecorationColor = "rgba(34,211,238,0.55)";
                e.currentTarget.style.textDecorationThickness = "1px";
                e.currentTarget.style.textUnderlineOffset = "5px";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = "var(--color-f3)";
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {item.label}
            </a>
          ))}
        </div>
        <Link
          href="/login"
          style={{
            display: "flex", alignItems: "center", gap: 6, alignSelf: "stretch",
            fontSize: 13, fontWeight: 600,
            background: "var(--color-cyan)", color: "#083344",
            padding: "0 24px", margin: "4px 4px 4px 0", borderRadius: 999,
            textDecoration: "none", transition: "opacity 150ms",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          Entrar <IconArrowRight size={14} />
        </Link>
      </nav>
      </div>

      {/* ── Hero zone — wrapper full-width para vignette cobrir 100vw × 100vh ── */}
      <div style={{ position: "relative" }}>

        {/* Vignette de borda — 4 gradientes lineares independentes, sem anéis */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          background: `
            linear-gradient(to right,  var(--color-bg) 0%, rgba(10,10,10,0) 12%, rgba(10,10,10,0) 88%, var(--color-bg) 100%),
            linear-gradient(to bottom, var(--color-bg) 0%, rgba(10,10,10,0) 10%, rgba(10,10,10,0) 82%, var(--color-bg) 100%)
          `,
        }} />

        {/* Espaçador do navbar flutuante: top(12) + height(52) + gap(8) */}
        <div style={{ height: 72, position: "relative", zIndex: 1 }} />

        {/* ── Hero ── */}
        <section style={{ position: "relative", zIndex: 1, padding: "0 48px", maxWidth: 1200, margin: "0 auto", minHeight: "calc(100vh - 116px)", display: "flex", alignItems: "center", width: "100%" }}>
        <div className="hero-grid" style={{ width: "100%", position: "relative" }}>

          {/* Coluna esquerda: texto + CTAs */}
          <div className="hero-text" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 999, border: "1px solid var(--color-cyan-border)", background: "var(--color-cyan-faint)", fontSize: 11, color: "var(--color-cyan)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 28, animation: "fadeUp 0.5s ease both" }}
            >
              <IconSparkles size={12} /> Diagnóstico · Controle · Educação
            </div>

            <h1 style={{
              fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700,
              fontSize: "clamp(38px, 5vw, 72px)",
              letterSpacing: "0.5px", lineHeight: 1.15, marginBottom: 24,
              animation: "fadeUp 0.55s 0.05s ease both",
            }}>
              Sua vida financeira.<br />
              <span style={{ color: "var(--color-cyan)" }}>Diagnosticada.</span>
            </h1>

            <p style={{
              fontSize: "clamp(14px, 1.5vw, 17px)", color: "var(--color-f3)",
              maxWidth: 480, lineHeight: 1.75, marginBottom: 36,
              animation: "fadeUp 0.55s 0.1s ease both",
            }}>
              DRE pessoal, score de saúde financeira em 4 dimensões, educação adaptada ao seu perfil e alertas proativos. Não só controle, diagnóstico.
            </p>

            <div className="hero-ctas" style={{ display: "flex", gap: 12, animation: "fadeUp 0.55s 0.15s ease both" }}>
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
          </div>

          {/* Coluna direita: mockup */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", animation: "fadeUp 0.7s 0.2s ease both" }}>
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", inset: -1,
                background: "linear-gradient(135deg, rgba(34,211,238,0.15), transparent 60%)",
                borderRadius: 18, filter: "blur(20px)",
              }} />
              <DashboardMockup />
            </div>
          </div>

        </div>
        </section>

      </div>{/* fim hero zone */}

      {/* ── Marquee — no fold, separando hero de funcionalidades ── */}
      <Marquee />

      {/* ── Sobre ── */}
      <section id="sobre" style={{
        padding: "96px 48px",
        background: "var(--color-bg2)",
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Watermark f(x) — easter egg visual */}
        <div style={{
          position: "absolute", right: "-16px", top: "50%",
          transform: "translateY(-50%)",
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700,
          fontSize: "clamp(180px, 24vw, 300px)",
          color: "rgba(34,211,238,0.035)",
          lineHeight: 1, pointerEvents: "none", userSelect: "none",
        }}>f(x)</div>

        <div style={{ maxWidth: 860, margin: "0 auto", position: "relative" }}>

          {/* Narrativa principal — grid 2×2: título/subtítulo na linha 1, parágrafos na linha 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto auto", columnGap: 64, rowGap: 0, marginBottom: 64 }}>

            {/* [1,1] Label + título */}
            <div style={{ paddingBottom: 20 }}>
              <div style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 14 }}>Sobre</div>
              <h2 style={{
                fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700,
                fontSize: "clamp(26px, 3.5vw, 38px)", letterSpacing: "-1px", lineHeight: 1.2,
                margin: 0,
              }}>
                Ninguém nos ensinou<br />
                <span style={{ color: "var(--color-cyan)" }}>a lidar com dinheiro.</span>
              </h2>
            </div>

            {/* [1,2] Subtítulo — encostado na base do título via align-self */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 28, height: 2, background: "var(--color-cyan)", borderRadius: 999, opacity: 0.7, flexShrink: 0 }} />
                <p style={{ fontSize: 15, color: "var(--color-f1)", fontWeight: 600, margin: 0 }}>
                  O Lyfx nasceu desse problema.
                </p>
              </div>
            </div>

            {/* [2,1] Parágrafos esquerda */}
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 28 }}>
              <p style={{ fontSize: 14, color: "var(--color-f3)", lineHeight: 1.85, marginBottom: 16 }}>
                A educação financeira nunca foi pauta do currículo escolar. Crescemos aprendendo a resolver equações, mas sem entender o que fazer com o salário no fim do mês.
              </p>
              <p style={{ fontSize: 14, color: "var(--color-f3)", lineHeight: 1.85 }}>
                O resultado é previsível: decisões no achismo, endividamento silencioso, e uma sensação constante de que o dinheiro nunca é suficiente, não por falta de esforço, mas por falta de clareza.
              </p>
            </div>

            {/* [2,2] Parágrafos direita */}
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 28 }}>
              <p style={{ fontSize: 14, color: "var(--color-f3)", lineHeight: 1.85, marginBottom: 16 }}>
                Uma plataforma que traduz a complexidade das finanças pessoais em diagnóstico claro, para que qualquer pessoa, com ou sem formação financeira, possa enxergar onde está e tomar decisões melhores.
              </p>
              <p style={{ fontSize: 14, color: "var(--color-f3)", lineHeight: 1.85 }}>
                Não é sobre perfeição. É sobre progresso mensurável, decisão a decisão.
              </p>
            </div>

          </div>

          {/* Divisor — easter egg */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16, marginBottom: 32,
          }}>
            <div style={{ flex: 1, height: "0.5px", background: "var(--color-border)" }} />
            <span style={{ fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-f4)" }}>A matemática por trás do nome</span>
            <div style={{ flex: 1, height: "0.5px", background: "var(--color-border)" }} />
          </div>

          {/* Cards f(x) — easter egg */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { symbol: "f′(x)", label: "Derivada",  desc: "Taxa de mudança. Os deltas do dashboard mostram quanto você evolui a cada mês.", highlight: false },
              { symbol: "∫f(x)dx", label: "Integral", desc: "Acumulação ao longo do tempo. Patrimônio, reservas e metas, a área sob a curva da sua vida.", highlight: true },
              { symbol: "lim→∞",  label: "Limite",   desc: "Independência financeira, o ponto onde f(x) converge para a vida que você projetou.", highlight: false },
            ].map(card => (
              <div key={card.label} style={{
                background: card.highlight ? "rgba(34,211,238,0.06)" : "var(--color-bg3)",
                border: `1px solid ${card.highlight ? "rgba(34,211,238,0.2)" : "var(--color-border)"}`,
                borderRadius: 14, padding: "22px 20px", textAlign: "center",
              }}>
                <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "clamp(24px, 3vw, 34px)", color: "var(--color-cyan)", lineHeight: 1, marginBottom: 12 }}>
                  {card.symbol}
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 10 }}>
                  {card.label}
                </div>
                <p style={{ fontSize: 12, color: card.highlight ? "var(--color-f2)" : "var(--color-f3)", lineHeight: 1.75, margin: 0 }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Fixed point */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 24px", background: "var(--color-bg3)", border: "1px solid var(--color-border)", borderRadius: 12 }}>
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: 20, color: "var(--color-cyan)", flexShrink: 0 }}>f(x) = x</div>
            <div style={{ width: "0.5px", height: 36, background: "var(--color-border)", flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: "var(--color-f4)", lineHeight: 1.7, margin: 0 }}>
              <span style={{ color: "var(--color-f3)" }}>Fixed point</span>, em matemática, o equilíbrio onde a função retorna a si mesma.{" "}
              <br />
              <span style={{ color: "var(--color-f2)", display: "inline-block", marginTop: 4 }}>Life Fixed</span>{" "}é isso: o estado onde sua vida financeira está no controle.
            </p>
          </div>

        </div>
      </section>

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

      {/* ── Pricing ── */}
      <section id="precos" style={{ padding: "96px 48px", borderTop: "1px solid var(--color-border)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 14 }}>Planos</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: "-1.5px", lineHeight: 1.15, marginBottom: 16 }}>
              Sua equação<br />
              <span style={{ color: "var(--color-cyan)" }}>tem solução.</span>
            </h2>
            <p style={{ fontSize: 15, color: "var(--color-f3)", lineHeight: 1.75, maxWidth: 420, margin: "0 auto" }}>
              Um plano. Acesso completo. Diagnóstico real das suas finanças, sem planilha, sem achismo.
            </p>
          </div>

          {/* Card único */}
          <div style={{
            maxWidth: 480, margin: "0 auto",
            background: "var(--color-bg2)",
            border: "1px solid rgba(34,211,238,0.25)",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 0 60px rgba(34,211,238,0.06)",
          }}>

            {/* Topo do card */}
            <div style={{
              padding: "36px 36px 28px",
              borderBottom: "1px solid var(--color-border)",
              background: "linear-gradient(160deg, rgba(34,211,238,0.06) 0%, transparent 60%)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-f2)", letterSpacing: "0.5px" }}>Lyfx Completo</span>
                <span style={{
                  fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase",
                  padding: "3px 10px", borderRadius: 999,
                  background: "rgba(34,211,238,0.1)", color: "var(--color-cyan)",
                  border: "1px solid rgba(34,211,238,0.2)",
                }}>Único plano</span>
              </div>

              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "var(--color-f4)", marginBottom: 6 }}>R$</span>
                <span style={{
                  fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700,
                  fontSize: 56, lineHeight: 1, color: "var(--color-cyan)", letterSpacing: "-2px",
                }}>XX,xx</span>
                <span style={{ fontSize: 13, color: "var(--color-f4)", marginBottom: 8 }}>/mês</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--color-f4)", lineHeight: 1.6, margin: 0 }}>
                Acesso completo a todas as funcionalidades. Sem limites, sem surpresas.
              </p>
            </div>

            {/* Features */}
            <div style={{ padding: "28px 36px 32px" }}>
              <div style={{ fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 18 }}>O que está incluído</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {[
                  "DRE Pessoal com categorização semântica",
                  "Score de saúde financeira em 4 dimensões",
                  "85 pílulas de educação financeira adaptadas ao seu perfil",
                  "Quiz de fixação e streak semanal",
                  "Alertas proativos de orçamento, metas e passivos",
                  "Gestão de passivos com método avalanche",
                  "Cadastro de bens, imóveis e veículos",
                  "Orçamento mensal por categoria",
                  "Controle de parcelamentos",
                  "Instituições financeiras vinculadas",
                  "Relatórios e histórico completo",
                  "Isolamento de dados por usuário",
                ].map(feature => (
                  <div key={feature} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 999, flexShrink: 0, marginTop: 1,
                      background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: 999, background: "var(--color-cyan)" }} />
                    </div>
                    <span style={{ fontSize: 13, color: "var(--color-f3)", lineHeight: 1.5 }}>{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/login"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  marginTop: 32, padding: "14px 0",
                  background: "var(--color-cyan)", color: "#083344",
                  borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none",
                  transition: "opacity 150ms",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Começar agora <IconArrowRight size={15} />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "96px 48px", maxWidth: 860, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 14 }}>FAQ</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-1px" }}>
            Dúvidas frequentes.
          </h2>
        </div>
        <div>
          <FAQList />
        </div>
      </section>

      {/* ── Footer Card ── */}
      <footer style={{ padding: "0 16px 16px" }}>
        <div style={{
          background: "var(--color-bg2)",
          border: "1px solid var(--color-border)",
          borderRadius: 32,
          overflow: "hidden",
        }}>

          {/* Info row */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "28px 36px",
            borderBottom: "1px solid rgba(34, 211, 238, 0.18)",
          }}>
            {/* Logo */}
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: 18 }}>
              Ly<span style={{ color: "var(--color-cyan)" }}>fx</span>
              <span style={{ fontFamily: "var(--font-body)", fontStyle: "normal", fontSize: 11, color: "var(--color-f4)", marginLeft: 8, letterSpacing: "1px" }}>LIFE FIXED</span>
            </div>

            {/* Voltar ao topo */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "transparent", border: "1px solid var(--color-border)",
                borderRadius: 8, padding: "7px 14px",
                fontSize: 11, color: "var(--color-f3)", cursor: "pointer",
                letterSpacing: "0.5px", textTransform: "uppercase",
                transition: "border-color 150ms, color 150ms",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-cyan)"; e.currentTarget.style.color = "var(--color-cyan)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-f3)"; }}
            >
              ↑ Voltar ao topo
            </button>

            {/* Meta */}
            <div style={{ fontSize: 11, color: "var(--color-f4)", textAlign: "right" }}>
              v1.6.3 · © 2026 Lyfx<br />
              <span style={{ color: "var(--color-f4)", opacity: 0.6 }}>Todos os direitos reservados.</span>
            </div>
          </div>

          {/* Marquee gigante */}
          <div style={{ overflow: "hidden", padding: "18px 0 20px" }}>
            <div style={{
              display: "flex",
              width: "max-content",
              animation: "marquee 22s linear infinite",
              whiteSpace: "nowrap",
              willChange: "transform",
            }}>
              {[0, 1].map(i => (
                <span key={i} style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 700,
                  fontSize: "clamp(56px, 9vw, 110px)",
                  letterSpacing: "-2px",
                  lineHeight: 1,
                  color: "var(--color-f1)",
                  opacity: 0.07,
                  userSelect: "none",
                  flexShrink: 0,
                }}>
                  Pronto para resolver sua equação?&nbsp;&nbsp;·&nbsp;&nbsp;
                </span>
              ))}
            </div>
          </div>

          {/* Linha de assinatura ciano no fundo */}
          <div style={{
            height: 2,
            background: "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.5) 40%, rgba(34,211,238,0.7) 50%, rgba(34,211,238,0.5) 60%, transparent 100%)",
          }} />

        </div>
      </footer>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        @property --border-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        @keyframes nav-comet {
          to { --border-angle: 360deg; }
        }

        .nav-comet-border {
          background: conic-gradient(
            from var(--border-angle),
            transparent 0%,
            transparent 55%,
            rgba(34, 211, 238, 0.12) 65%,
            rgba(34, 211, 238, 0.55) 72%,
            rgba(34, 211, 238, 1)    75%,
            rgba(34, 211, 238, 0.55) 78%,
            rgba(34, 211, 238, 0.12) 85%,
            transparent 92%,
            transparent 100%
          );
          animation: nav-comet 3.5s linear infinite;
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
      `}</style>
    </div>
  );
}

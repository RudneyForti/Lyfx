"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconChevronDown, IconChevronRight,
  IconArrowRight, IconSparkles,
  IconLayoutDashboard, IconTarget, IconRepeat, IconTag,
} from "@tabler/icons-react";

/* ── Marquee ── */
const MARQUEE_ITEMS = [
  "DRE Pessoal", "Orçamento Inteligente", "Contas Fixas",
  "Tags & Categorias", "Fluxo de Caixa", "Controle Total",
  "Receitas & Despesas", "Metas Financeiras", "Relatórios",
  "Lyfx", "Life Fixed",
];

function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)", padding: "14px 0", background: "var(--color-bg2)" }}>
      <div style={{ display: "flex", gap: 0, animation: "marquee 28s linear infinite", width: "max-content" }}>
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
      {/* Bar chart */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: "var(--color-f4)", marginBottom: 10, letterSpacing: "0.5px" }}>HISTÓRICO</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
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
      {/* Recent transactions */}
      <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 14 }}>
        <div style={{ fontSize: 10, color: "var(--color-f4)", marginBottom: 10, letterSpacing: "0.5px" }}>ÚLTIMOS LANÇAMENTOS</div>
        {[
          { desc: "Salário", cat: "Receita fixa", val: "+R$ 6.000", color: "var(--color-green)" },
          { desc: "Aluguel", cat: "Moradia", val: "-R$ 1.800", color: "var(--color-red)" },
          { desc: "Freelance", cat: "Receita variável", val: "+R$ 2.400", color: "var(--color-green)" },
        ].map(t => (
          <div key={t.desc} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--color-border)" }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--color-f1)" }}>{t.desc}</div>
              <div style={{ fontSize: 10, color: "var(--color-f4)" }}>{t.cat}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.color }}>{t.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Features ── */
const FEATURES = [
  {
    icon: <IconLayoutDashboard size={20} />,
    title: "DRE Pessoal",
    desc: "Visualize receitas e despesas organizadas por categoria, exatamente como uma empresa faria. Saiba onde cada real foi parar.",
    color: "#22D3EE",
    mockup: (
      <div style={{ padding: "16px 0 4px" }}>
        {[
          { label: "Receita fixa", val: "R$ 6.000", pct: 100, color: "#A3E635" },
          { label: "Desp. fixa", val: "R$ 2.100", pct: 35, color: "#F87171" },
          { label: "Desp. variável", val: "R$ 1.840", pct: 30, color: "#FB923C" },
          { label: "Investimento", val: "R$ 800", pct: 13, color: "#22D3EE" },
        ].map(r => (
          <div key={r.label} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: "var(--color-f3)" }}>{r.label}</span>
              <span style={{ color: "var(--color-f2)", fontWeight: 500 }}>{r.val}</span>
            </div>
            <div style={{ height: 4, background: "var(--color-bg5)", borderRadius: 999 }}>
              <div style={{ height: "100%", width: `${r.pct}%`, background: r.color, borderRadius: 999, transition: "width 1s ease" }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: <IconTarget size={20} />,
    title: "Orçamento",
    desc: "Defina limites mensais por categoria e acompanhe em tempo real o quanto você ainda tem disponível.",
    color: "#A3E635",
    mockup: (
      <div style={{ padding: "16px 0 4px" }}>
        {[
          { label: "Alimentação", spent: 680, limit: 800, color: "#A3E635" },
          { label: "Transporte", spent: 290, limit: 300, color: "#FBBF24" },
          { label: "Lazer", spent: 520, limit: 400, color: "#F87171" },
          { label: "Saúde", spent: 180, limit: 500, color: "#A3E635" },
        ].map(b => {
          const pct = Math.min((b.spent / b.limit) * 100, 100);
          return (
            <div key={b.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: "var(--color-f3)" }}>{b.label}</span>
                <span style={{ color: pct >= 100 ? "var(--color-red)" : "var(--color-f4)", fontSize: 10 }}>
                  R$ {b.spent} / {b.limit}
                </span>
              </div>
              <div style={{ height: 4, background: "var(--color-bg5)", borderRadius: 999 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: b.color, borderRadius: 999 }} />
              </div>
            </div>
          );
        })}
      </div>
    ),
  },
  {
    icon: <IconRepeat size={20} />,
    title: "Contas Fixas",
    desc: "Tenha clareza total sobre seus compromissos mensais e anuais. Projeções de 12 meses para não ser pego de surpresa.",
    color: "#FBBF24",
    mockup: (
      <div style={{ padding: "16px 0 4px", display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { name: "Netflix", val: "R$ 55,90", freq: "Mensal" },
          { name: "Spotify", val: "R$ 21,90", freq: "Mensal" },
          { name: "Aluguel", val: "R$ 1.800", freq: "Mensal" },
          { name: "IPVA", val: "R$ 1.240", freq: "Anual" },
        ].map(item => (
          <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", background: "var(--color-bg3)", borderRadius: 8, border: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: 12, color: "var(--color-f2)" }}>{item.name}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "rgba(255,255,255,0.05)", color: "var(--color-f4)" }}>{item.freq}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-f1)" }}>{item.val}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: <IconTag size={20} />,
    title: "Tags",
    desc: "Crie etiquetas personalizadas e classifique qualquer lançamento. Filtre, agrupe e entenda seus padrões de gasto.",
    color: "#A78BFA",
    mockup: (
      <div style={{ padding: "16px 0 4px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
          {[
            { name: "Viagem", color: "#22D3EE" }, { name: "Trabalho", color: "#A78BFA" },
            { name: "Saúde", color: "#F87171" }, { name: "Casa", color: "#FBBF24" },
            { name: "Pet", color: "#FB923C" }, { name: "Lazer", color: "#A3E635" },
          ].map(t => (
            <span key={t.name} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, border: `1px solid ${t.color}44`, color: t.color, background: `${t.color}12` }}>{t.name}</span>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--color-f4)" }}>
          6 tags · 34 transações classificadas
        </div>
      </div>
    ),
  },
];

/* ── FAQ ── */
const FAQ_ITEMS = [
  {
    q: "O Lyfx é gratuito?",
    a: "Sim. Você pode criar sua conta e começar a usar agora, sem cartão de crédito e sem compromisso.",
  },
  {
    q: "Preciso instalar alguma coisa?",
    a: "Não. O Lyfx roda direto no navegador, em qualquer dispositivo. Sem download, sem instalação.",
  },
  {
    q: "Meus dados financeiros ficam seguros?",
    a: "Seus dados são armazenados de forma segura e você mantém controle total sobre eles. Privacidade é uma prioridade no Lyfx.",
  },
  {
    q: "É possível importar dados de outros aplicativos?",
    a: "Em breve. Estamos desenvolvendo importação de extratos bancários em OFX e CSV. Você será notificado quando estiver disponível.",
  },
  {
    q: "O Lyfx funciona no celular?",
    a: "A interface é responsiva e funciona bem em qualquer dispositivo. Um app nativo para iOS e Android está no nosso roadmap.",
  },
  {
    q: "O que é uma DRE pessoal?",
    a: "DRE (Demonstração do Resultado do Exercício) é o relatório que empresas usam para entender receitas e despesas. O Lyfx traz essa mesma clareza para suas finanças pessoais.",
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
          Começar grátis <IconArrowRight size={14} />
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: "100px 48px 80px", maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 999, border: "1px solid var(--color-cyan-border)", background: "var(--color-cyan-faint)", fontSize: 11, color: "var(--color-cyan)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 32, animation: "fadeUp 0.5s ease both" }}
        >
          <IconSparkles size={12} /> Controle financeiro de verdade
        </div>

        <h1 style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700,
          fontSize: "clamp(42px, 7vw, 80px)", textAlign: "center",
          letterSpacing: "-2px", lineHeight: 1.1, marginBottom: 24,
          animation: "fadeUp 0.55s 0.05s ease both",
        }}>
          Sua DRE pessoal.<br />
          <span style={{ color: "var(--color-cyan)" }}>Finalmente.</span>
        </h1>

        <p style={{
          fontSize: "clamp(15px, 2vw, 18px)", color: "var(--color-f3)", textAlign: "center",
          maxWidth: 520, lineHeight: 1.75, marginBottom: 40,
          animation: "fadeUp 0.55s 0.1s ease both",
        }}>
          Entenda para onde vai cada real. Controle receitas, despesas, orçamentos e metas com a clareza que você sempre quis.
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
            Criar conta grátis <IconArrowRight size={15} />
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
      <section id="funcionalidades" style={{ padding: "96px 48px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 14 }}>Funcionalidades</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: "clamp(28px, 4vw, 42px)", letterSpacing: "-1px", lineHeight: 1.2 }}>
            Tudo que você precisa.<br />
            <span style={{ color: "var(--color-cyan)" }}>Nada que você não precisa.</span>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
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
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 14 }}>Como funciona</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-1px", marginBottom: 56 }}>
            Simples assim.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, position: "relative" }}>
            {[
              { step: "01", title: "Crie sua conta", desc: "30 segundos. Sem cartão, sem burocracia. Só você e sua conta." },
              { step: "02", title: "Lance suas transações", desc: "Receitas, despesas, recorrências. Tudo categorizado e com tags." },
              { step: "03", title: "Veja sua DRE", desc: "Entenda exatamente para onde foi cada real. Mês a mês." },
            ].map((s, i) => (
              <div key={s.step} style={{ position: "relative", padding: "28px 20px", background: "var(--color-bg3)", borderRadius: 14, border: "1px solid var(--color-border)" }}>
                {i < 2 && (
                  <div style={{ position: "absolute", right: -22, top: "50%", transform: "translateY(-50%)", color: "var(--color-f4)", zIndex: 1 }}>
                    <IconChevronRight size={16} />
                  </div>
                )}
                <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 36, fontWeight: 700, color: "var(--color-cyan)", opacity: 0.3, lineHeight: 1, marginBottom: 12 }}>{s.step}</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "var(--color-f3)", lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
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
            Criar conta grátis <IconArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--color-border)", padding: "28px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: 18 }}>
          Ly<span style={{ color: "var(--color-cyan)" }}>fx</span>
          <span style={{ fontFamily: "var(--font-body)", fontStyle: "normal", fontSize: 11, color: "var(--color-f4)", marginLeft: 8, letterSpacing: "1px" }}>LIFE FIXED</span>
        </div>
        <div style={{ fontSize: 11, color: "var(--color-f4)" }}>© 2026 Lyfx. Todos os direitos reservados.</div>
      </footer>

      {/* ── Marquee keyframe ── */}
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

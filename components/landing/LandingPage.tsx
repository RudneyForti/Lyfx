"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  IconChevronDown, IconChevronRight,
  IconArrowRight, IconSparkles,
  IconLayoutDashboard, IconHeartRateMonitor,
  IconBook2, IconAlertTriangle, IconBuildingBank, IconCreditCard,
  IconMenu2, IconX,
} from "@tabler/icons-react";
import { T, type Lang, type Translations } from "./translations";

/* ── Flag icons — monochrome white outline ── */
function FlagIcon({ lang, size = 22 }: { lang: Lang; size?: number }) {
  const h = Math.round(size * 0.68);
  if (lang === "pt") return (
    <svg width={size} height={h} viewBox="0 0 22 15" fill="none" aria-label="Português">
      <rect x="0.8" y="0.8" width="20.4" height="13.4" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 2.4 L19.2 7.5 L11 12.6 L2.8 7.5 Z" stroke="currentColor" strokeWidth="1" />
      <circle cx="11" cy="7.5" r="2.4" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
  if (lang === "en") return (
    <svg width={size} height={h} viewBox="0 0 22 15" fill="none" aria-label="English">
      <rect x="0.8" y="0.8" width="20.4" height="13.4" rx="2" stroke="currentColor" strokeWidth="1.4" />
      {[3.4, 5.4, 7.4, 9.4, 11.3].map((y, i) => (
        <line key={i} x1="0.8" y1={y} x2="21.2" y2={y} stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.55" />
      ))}
      <rect x="0.8" y="0.8" width="8.5" height="6.6" fill="currentColor" fillOpacity="0.22" />
    </svg>
  );
  /* es — Spain */
  return (
    <svg width={size} height={h} viewBox="0 0 22 15" fill="none" aria-label="Español">
      <rect x="0.8" y="0.8" width="20.4" height="13.4" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="0.8" y="0.8" width="20.4" height="3.6" fill="currentColor" fillOpacity="0.25" />
      <rect x="0.8" y="10.6" width="20.4" height="3.6" fill="currentColor" fillOpacity="0.25" />
      <line x1="0.8" y1="4.4" x2="21.2" y2="4.4" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.6" />
      <line x1="0.8" y1="10.6" x2="21.2" y2="10.6" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.6" />
    </svg>
  );
}

/* ── Language selector ── */
const LANG_OPTIONS: Array<{ value: Lang; label: string }> = [
  { value: "pt", label: "Português" },
  { value: "en", label: "English"   },
  { value: "es", label: "Español"   },
];

function LangSelector({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.13)",
          borderRadius: 8, padding: "5px 10px",
          cursor: "pointer", color: "rgba(255,255,255,0.65)",
          transition: "border-color 150ms, color 150ms",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)"; e.currentTarget.style.color = "rgba(255,255,255,0.9)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.13)"; e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
      >
        <FlagIcon lang={lang} size={22} />
        <IconChevronDown
          size={11}
          style={{ transition: "transform 200ms", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "rgba(14,14,14,0.96)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, padding: "5px",
          minWidth: 148,
          boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
          zIndex: 200,
        }}>
          {LANG_OPTIONS.map(opt => {
            const active = lang === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { setLang(opt.value); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "8px 10px",
                  background: active ? "rgba(34,211,238,0.09)" : "transparent",
                  border: "none", borderRadius: 8,
                  color: active ? "var(--color-cyan)" : "var(--color-f3)",
                  fontSize: 13, cursor: "pointer",
                  transition: "background 150ms, color 150ms",
                  textAlign: "left",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--color-f1)"; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-f3)"; } }}
              >
                <FlagIcon lang={opt.value} size={22} />
                <span style={{ flex: 1 }}>{opt.label}</span>
                {active && <div style={{ width: 6, height: 6, borderRadius: 999, background: "var(--color-cyan)", flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Marquee ── */
function Marquee({ items }: { items: readonly string[] }) {
  const doubled = [...items, ...items];
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)", padding: "14px 0", background: "var(--color-bg2)" }}>
      <div style={{ display: "flex", gap: 0, animation: "marquee 36s linear infinite", width: "max-content" }}>
        {doubled.map((item, i) => (
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
function DashboardMockup({ d }: { d: Translations["dashboard"] }) {
  const bars = [55, 80, 45, 90, 62, 75, 40];
  return (
    <div style={{
      background: "var(--color-bg2)", border: "1px solid var(--color-border2)",
      borderRadius: 16, padding: 20, width: "100%", maxWidth: 480,
      boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{d.month}</div>
        <div style={{ fontSize: 10, padding: "3px 10px", borderRadius: 999, background: "rgba(163,230,53,0.1)", color: "var(--color-green)", border: "1px solid rgba(163,230,53,0.2)" }}>{d.vsLast}</div>
      </div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
        {[
          { label: d.income,   value: d.kpiIncome,   color: "var(--color-green)" },
          { label: d.expenses, value: d.kpiExpenses, color: "var(--color-red)"   },
          { label: d.result,   value: d.kpiResult,   color: "var(--color-cyan)"  },
        ].map(k => (
          <div key={k.label} style={{ background: "var(--color-bg3)", borderRadius: 10, padding: "10px 12px", border: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: 10, color: "var(--color-f4)", marginBottom: 4, letterSpacing: "0.5px" }}>{k.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, fontStyle: "italic", fontFamily: "var(--font-display)", color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>
      {/* Health score */}
      <div style={{ background: "var(--color-bg3)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--color-border)", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: "var(--color-f4)", letterSpacing: "0.5px" }}>{d.health}</span>
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(34,211,238,0.1)", color: "var(--color-cyan)", border: "1px solid rgba(34,211,238,0.2)" }}>{d.stable}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, fontWeight: 700, color: "var(--color-cyan)" }}>74</div>
          <div style={{ flex: 1 }}>
            {[
              { label: d.commitment, pct: 68, color: "#FBBF24" },
              { label: d.savings,    pct: 82, color: "#A3E635" },
            ].map(dd => (
              <div key={dd.label} style={{ marginBottom: 5 }}>
                <div style={{ height: 3, background: "var(--color-bg5)", borderRadius: 999 }}>
                  <div style={{ height: "100%", width: `${dd.pct}%`, background: dd.color, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Bar chart */}
      <div>
        <div style={{ fontSize: 10, color: "var(--color-f4)", marginBottom: 10, letterSpacing: "0.5px" }}>{d.history}</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 50 }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{ width: "100%", height: `${h}%`, borderRadius: 4, background: i === 6 ? "var(--color-cyan)" : `rgba(34,211,238,${0.15 + i * 0.04})`, minHeight: 4 }} />
              <span style={{ fontSize: 9, color: "var(--color-f4)" }}>{d.months[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Features ── */
function getFeatures(t: Translations) {
  const m = t.mocks;
  return [
    {
      icon: <IconLayoutDashboard size={20} />,
      title: t.featureItems[0].title,
      desc:  t.featureItems[0].desc,
      color: "#22D3EE",
      mockup: (
        <div style={{ padding: "16px 0 4px" }}>
          {[
            { label: m.fixedIncome,  val: m.dreV1, pct: 100, color: "#A3E635" },
            { label: m.committedExp, val: m.dreV2, pct: 35,  color: "#F87171" },
            { label: m.variableExp,  val: m.dreV3, pct: 30,  color: "#FB923C" },
            { label: m.investment,   val: m.dreV4, pct: 13,  color: "#22D3EE" },
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
      title: t.featureItems[1].title,
      desc:  t.featureItems[1].desc,
      color: "#A3E635",
      mockup: (
        <div style={{ padding: "16px 0 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 40, fontWeight: 700, color: "#A3E635", lineHeight: 1 }}>74</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#A3E635", marginBottom: 2 }}>{m.stable}</div>
              <div style={{ fontSize: 11, color: "var(--color-f4)" }}>{m.goodPerf}</div>
            </div>
          </div>
          {[
            { label: m.commitment, val: "68%",     color: "#FBBF24", pct: 68 },
            { label: m.savings,    val: "19%",     color: "#A3E635", pct: 82 },
            { label: m.result,     val: "38%",     color: "#A3E635", pct: 78 },
            { label: m.reserve,    val: "3",       color: "#22D3EE", pct: 60 },
          ].map(dd => (
            <div key={dd.label} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: "var(--color-f3)" }}>{dd.label}</span>
                <span style={{ color: dd.color, fontWeight: 500 }}>{dd.val}</span>
              </div>
              <div style={{ height: 3, background: "var(--color-bg5)", borderRadius: 999 }}>
                <div style={{ height: "100%", width: `${dd.pct}%`, background: dd.color, borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <IconBook2 size={20} />,
      title: t.featureItems[2].title,
      desc:  t.featureItems[2].desc,
      color: "#A78BFA",
      mockup: (
        <div style={{ padding: "16px 0 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "var(--color-f4)" }}>{m.track} <span style={{ color: "#A78BFA" }}>{m.stableTrack}</span></div>
            <div style={{ display: "flex", gap: 3 }}>
              {[1,1,1,1,1,1,0,0,0,0,0,0].map((w, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: w ? "#A78BFA" : "var(--color-bg5)" }} />
              ))}
            </div>
          </div>
          {[
            { title: m.pill1, done: true  },
            { title: m.pill2, done: true  },
            { title: m.pill3, done: false },
          ].map(p => (
            <div key={p.title} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ width: 18, height: 18, borderRadius: 999, flexShrink: 0, background: p.done ? "#A78BFA22" : "var(--color-bg5)", border: `1px solid ${p.done ? "#A78BFA" : "var(--color-border)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.done && <div style={{ width: 8, height: 8, borderRadius: 999, background: "#A78BFA" }} />}
              </div>
              <span style={{ fontSize: 12, color: p.done ? "var(--color-f3)" : "var(--color-f2)" }}>{p.title}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, fontSize: 11, color: "var(--color-f4)" }}>🔥 {m.streakLabel} <span style={{ color: "#A78BFA", fontWeight: 600 }}>{m.streakVal}</span></div>
        </div>
      ),
    },
    {
      icon: <IconAlertTriangle size={20} />,
      title: t.featureItems[3].title,
      desc:  t.featureItems[3].desc,
      color: "#FB923C",
      mockup: (
        <div style={{ padding: "16px 0 4px", display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            { type: "danger",  icon: "🔴", msg: m.a1msg, sub: m.a1sub },
            { type: "warning", icon: "🟡", msg: m.a2msg, sub: m.a2sub },
            { type: "info",    icon: "🔵", msg: m.a3msg, sub: m.a3sub },
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
      title: t.featureItems[4].title,
      desc:  t.featureItems[4].desc,
      color: "#F87171",
      mockup: (
        <div style={{ padding: "16px 0 4px" }}>
          {[
            { name: m.l1name, rate: m.l1rate, balance: m.l1balance, color: "#F87171" },
            { name: m.l2name, rate: m.l2rate, balance: m.l2balance, color: "#FBBF24" },
            { name: m.l3name, rate: m.l3rate, balance: m.l3balance, color: "#FB923C" },
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
            {m.avalanche.split("R$")[0]}<span style={{ color: "#22D3EE" }}>R${m.avalanche.split("R$")[1]}</span>
          </div>
        </div>
      ),
    },
    {
      icon: <IconBuildingBank size={20} />,
      title: t.featureItems[5].title,
      desc:  t.featureItems[5].desc,
      color: "#FBBF24",
      mockup: (
        <div style={{ padding: "16px 0 4px", display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { name: m.a1n, type: m.a1t, val: m.a1v, badge: m.a1b, badgeColor: "#F87171" },
            { name: m.a2n, type: m.a2t, val: m.a2v, badge: m.a2b, badgeColor: "#A3E635" },
            { name: m.a3n, type: m.a3t, val: m.a3v, badge: m.a3b, badgeColor: "#22D3EE" },
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
}

/* ── FAQ item ── */
function FAQItem({ q, a, index, open, onToggle }: { q: string; a: string; index: number; open: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer", borderRadius: 14, padding: "18px 20px", marginBottom: 4,
        background: open ? "rgba(34,211,238,0.06)" : hovered ? "rgba(34,211,238,0.025)" : "transparent",
        border: "1px solid transparent",
        borderBottom: open ? "1px solid rgba(34,211,238,0.22)" : "1px solid var(--color-border)",
        outline: open ? "1px solid rgba(34,211,238,0.22)" : "1px solid transparent",
        transition: "background 0.2s ease, border-color 0.2s ease, outline-color 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <span style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700,
          fontSize: 18, lineHeight: 1, color: "var(--color-cyan)",
          opacity: open ? 0.7 : hovered ? 0.5 : 0.35,
          flexShrink: 0, width: 28, transition: "opacity 0.2s",
        }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span style={{ fontSize: 15, fontWeight: 500, flex: 1, color: open || hovered ? "var(--color-f1)" : "var(--color-f2)", transition: "color 0.2s" }}>
          {q}
        </span>
        <span style={{
          flexShrink: 0, color: open || hovered ? "var(--color-cyan)" : "var(--color-f4)",
          transform: open ? "rotate(90deg)" : hovered ? "rotate(0deg)" : "rotate(-45deg)",
          transition: "color 0.2s, transform 0.22s ease", display: "flex",
        }}>
          <IconArrowRight size={16} />
        </span>
      </div>
      {open && (
        <p style={{ fontSize: 14, color: "var(--color-f3)", lineHeight: 1.75, margin: "14px 0 0 48px" }}>{a}</p>
      )}
    </div>
  );
}

/* ── FAQ list ── */
function FAQList({ items }: { items: ReadonlyArray<{ q: string; a: string }> }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <>
      {items.map((item, i) => (
        <FAQItem
          key={i} q={item.q} a={item.a} index={i}
          open={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        />
      ))}
    </>
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
        position: "relative", padding: "28px 20px", borderRadius: 14,
        border: `1px solid ${hovered ? color : "var(--color-border)"}`,
        background: hovered ? hexToRgba(color, 0.12) : "var(--color-bg3)",
        transition: "background 0.25s ease, border-color 0.25s ease",
        cursor: "default", overflow: "hidden",
      }}
    >
      <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 36, fontWeight: 700, color, opacity: hovered ? 0.6 : 0.35, lineHeight: 1, marginBottom: 12, transition: "opacity 0.25s ease" }}>{step}</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color, transition: "color 0.25s ease" }}>{title}</div>
      <div style={{ fontSize: 12, lineHeight: 1.7, color: hovered ? "var(--color-f2)" : "var(--color-f3)", transition: "color 0.25s ease" }}>{desc}</div>
      {!isLast && (
        <div className="step-arrow" style={{ opacity: hovered ? 1 : 0, transform: hovered ? "translateX(0)" : "translateX(-6px)", transition: "opacity 0.25s ease, transform 0.25s ease", color }}>
          <IconChevronRight size={20} />
        </div>
      )}
    </div>
  );
}

/* ── Main ── */
function detectLang(): Lang {
  try {
    const saved = localStorage.getItem("lyfx-lang") as Lang | null;
    if (saved && ["pt", "en", "es"].includes(saved)) return saved;
    const nav = navigator.language.toLowerCase();
    if (nav.startsWith("pt")) return "pt";
    if (nav.startsWith("es")) return "es";
    if (nav.startsWith("en")) return "en";
  } catch {}
  return "pt";
}

export function LandingPage({ version = "1.0.0" }: { version?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [lang, setLang] = useState<Lang>("pt");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setLang(detectLang());
  }, []);

  function handleSetLang(l: Lang) {
    try { localStorage.setItem("lyfx-lang", l); } catch {}
    setLang(l);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const t = T[lang];
  const features = getFeatures(t);

  return (
    <div style={{
      background: "var(--color-bg)",
      backgroundImage: "radial-gradient(circle, rgba(34,211,238,0.09) 1px, transparent 1px)",
      backgroundSize: "32px 32px",
      color: "var(--color-f1)", fontFamily: "var(--font-body)", overflowX: "hidden",
    }}>

      <style>{`
        /* ── Hero ── */
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
        .hero-spacer { height: 72px; }
        .hero-section { padding: 0 48px; }

        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr; gap: 40px; text-align: center; }
          .hero-text { align-items: center !important; }
          .hero-ctas { justify-content: center !important; }
          .hero-section { padding: 0 24px; }
        }
        @media (max-width: 640px) {
          .hero-spacer { height: 88px; }
          .hero-grid { gap: 32px; padding-bottom: 48px; }
          .hero-section { padding: 0 16px; }
        }

        /* ── Section padding ── */
        .section-pad { padding: 96px 48px; }
        @media (max-width: 900px) { .section-pad { padding: 72px 24px; } }
        @media (max-width: 640px) { .section-pad { padding: 56px 16px; } }

        /* ── Navbar ── */
        .nav-links { display: flex; align-items: center; gap: 32px; }
        .nav-login-btn { display: flex; }
        .nav-hamburger { display: none; background: var(--color-cyan); border: none; border-radius: 26px; padding: 0 16px; height: 42px; cursor: pointer; color: #083344; align-items: center; justify-content: center; transition: opacity 150ms; flex-shrink: 0; }
        .nav-hamburger:hover { opacity: 0.85; }
        .nav-mobile-overlay { display: none; }

        @media (max-width: 768px) {
          .nav-links { display: none; }
          .nav-login-btn { display: none; }
          .nav-hamburger { display: flex; }
          .nav-mobile-overlay { display: flex; }
        }

        /* ── Sobre ── */
        .sobre-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; column-gap: 64px; row-gap: 0; margin-bottom: 64px; }
        .sobre-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }

        @media (max-width: 768px) {
          .sobre-grid { grid-template-columns: 1fr; column-gap: 0; margin-bottom: 40px; }
          .sobre-grid > div { border-top: none !important; padding-top: 0 !important; }
          .sobre-grid > div:nth-child(3),
          .sobre-grid > div:nth-child(4) { border-top: 1px solid var(--color-border) !important; padding-top: 24px !important; }
          .sobre-cards { grid-template-columns: 1fr; }
        }
        @media (min-width: 481px) and (max-width: 768px) {
          .sobre-cards { grid-template-columns: repeat(2, 1fr); }
        }

        /* ── Features ── */
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
        @media (max-width: 640px) { .features-grid { grid-template-columns: 1fr; } }

        /* ── Steps ── */
        .steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 900px) { .steps-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .steps-grid { grid-template-columns: 1fr; } }

        /* ── Step arrow ── */
        .step-arrow { position: absolute; right: 12px; bottom: 12px; }
        @media (max-width: 480px) {
          .step-arrow { right: auto; bottom: 10px; left: 50%; transform: translateX(-50%) !important; opacity: 1 !important; }
          .step-arrow svg { transform: rotate(90deg); }
        }

        /* ── Footer ── */
        .footer-top { display: flex; align-items: center; justify-content: space-between; padding: 28px 36px; border-bottom: 1px solid rgba(34,211,238,0.18); }
        .footer-version { font-size: 11px; color: var(--color-f4); text-align: right; }
        @media (max-width: 640px) {
          .footer-top { flex-wrap: wrap; align-items: center; gap: 0; padding: 24px 20px 20px; }
          .footer-version { width: 100%; margin-top: 16px; text-align: left !important; }
        }
      `}</style>

      {/* ── Navbar wrapper ── */}
      <div style={{
        position: "fixed", top: 12, left: 16, right: 16, zIndex: 50, borderRadius: 32,
        background: "rgba(255,255,255,0.06)",
      }}>
        {/* Comet layer */}
        <div
          className={scrolled ? "nav-comet-border" : ""}
          style={{
            position: "absolute", inset: 0, borderRadius: 32, padding: 1,
            pointerEvents: "none",
            opacity: scrolled ? 1 : 0,
            transition: "opacity 0.6s ease",
          }}
        />

        <nav style={{
          position: "relative", margin: 1,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 0 0 28px", height: 50, borderRadius: 31,
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

          {/* Nav links — hidden on mobile */}
          <div className="nav-links">
            {[
              { label: t.nav.sobre,            anchor: "sobre"          },
              { label: t.nav.funcionalidades,  anchor: "funcionalidades"},
              { label: t.nav.comoFunciona,     anchor: "como-funciona"  },
              { label: t.nav.precos,           anchor: "precos"         },
              { label: t.nav.faq,              anchor: "faq"            },
            ].map(item => (
              <a
                key={item.anchor}
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

          {/* Right side: lang selector + login + hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 4px 4px 0" }}>
            <LangSelector lang={lang} setLang={handleSetLang} />
            <div className="nav-login-btn">
              <Link
                href="/login"
                style={{
                  display: "flex", alignItems: "center", gap: 6, alignSelf: "stretch",
                  fontSize: 13, fontWeight: 600,
                  background: "var(--color-cyan)", color: "#083344",
                  padding: "0 24px", borderRadius: 999,
                  textDecoration: "none", transition: "opacity 150ms",
                  height: 42,
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                {t.nav.entrar} <IconArrowRight size={14} />
              </Link>
            </div>
            <button
              className="nav-hamburger"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {menuOpen ? <IconX size={18} /> : <IconMenu2 size={18} />}
            </button>
          </div>
        </nav>
      </div>

      {/* ── Mobile menu overlay ── */}
      {menuOpen && (
        <div className="nav-mobile-overlay" style={{
          position: "fixed", top: 76, left: 16, right: 16, zIndex: 48,
          background: "rgba(10,10,10,0.97)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16, padding: "8px 8px 16px",
          flexDirection: "column", gap: 2,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}>
          {[
            { label: t.nav.sobre,            anchor: "sobre"          },
            { label: t.nav.funcionalidades,  anchor: "funcionalidades"},
            { label: t.nav.comoFunciona,     anchor: "como-funciona"  },
            { label: t.nav.precos,           anchor: "precos"         },
            { label: t.nav.faq,              anchor: "faq"            },
          ].map(item => (
            <a
              key={item.anchor}
              href={`#${item.anchor}`}
              onClick={() => setMenuOpen(false)}
              style={{ display: "block", padding: "13px 16px", fontSize: 15, color: "var(--color-f2)", textDecoration: "none", borderRadius: 10, transition: "background 150ms, color 150ms" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "var(--color-f1)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-f2)"; }}
            >
              {item.label}
            </a>
          ))}
          <div style={{ height: 1, background: "var(--color-border)", margin: "8px 0" }} />
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 16px", margin: "0 0", background: "var(--color-cyan)", color: "#083344", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none" }}
          >
            {t.nav.entrar} <IconArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── Hero zone ── */}
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          background: `
            linear-gradient(to right,  var(--color-bg) 0%, rgba(10,10,10,0) 12%, rgba(10,10,10,0) 88%, var(--color-bg) 100%),
            linear-gradient(to bottom, var(--color-bg) 0%, rgba(10,10,10,0) 10%, rgba(10,10,10,0) 82%, var(--color-bg) 100%)
          `,
        }} />
        <div className="hero-spacer" style={{ position: "relative", zIndex: 1 }} />

        <section className="hero-section" style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", minHeight: "calc(100vh - 116px)", display: "flex", alignItems: "center", width: "100%" }}>
          <div className="hero-grid" style={{ width: "100%", position: "relative" }}>

            <div className="hero-text" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 999, border: "1px solid var(--color-cyan-border)", background: "var(--color-cyan-faint)", fontSize: 11, color: "var(--color-cyan)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 28, animation: "fadeUp 0.5s ease both" }}>
                <IconSparkles size={12} /> {t.hero.badge}
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: "clamp(38px, 5vw, 72px)", letterSpacing: "0.5px", lineHeight: 1.15, marginBottom: 24, animation: "fadeUp 0.55s 0.05s ease both", fontVariantLigatures: "no-common-ligatures" }}>
                {t.hero.h1a}<br />
                <span style={{ color: "var(--color-cyan)" }}>{t.hero.h1b}</span>
              </h1>
              <p style={{ fontSize: "clamp(14px, 1.5vw, 17px)", color: "var(--color-f3)", lineHeight: 1.75, marginBottom: 36, animation: "fadeUp 0.55s 0.1s ease both" }}>
                {t.hero.p}
              </p>
              <div className="hero-ctas" style={{ display: "flex", gap: 12, animation: "fadeUp 0.55s 0.15s ease both" }}>
                <Link
                  href="/login"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 28px", background: "var(--color-cyan)", color: "#083344", borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none", transition: "opacity 150ms" }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  {t.hero.ctaPrimary} <IconArrowRight size={15} />
                </Link>
                <a
                  href="#como-funciona"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 24px", background: "transparent", color: "var(--color-f2)", border: "1px solid var(--color-border2)", borderRadius: 10, fontSize: 14, textDecoration: "none", transition: "all 150ms" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "var(--color-f1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border2)"; e.currentTarget.style.color = "var(--color-f2)"; }}
                >
                  {t.hero.ctaSecondary}
                </a>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", animation: "fadeUp 0.7s 0.2s ease both" }}>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", inset: -1, background: "linear-gradient(135deg, rgba(34,211,238,0.15), transparent 60%)", borderRadius: 18, filter: "blur(20px)" }} />
                <DashboardMockup d={t.dashboard} />
              </div>
            </div>

          </div>
        </section>
      </div>

      {/* ── Marquee ── */}
      <Marquee items={t.marquee} />

      {/* ── Sobre ── */}
      <section id="sobre" className="section-pad" style={{ background: "var(--color-bg2)", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: "-16px", top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: "clamp(180px, 24vw, 300px)", color: "rgba(34,211,238,0.035)", lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>f(x)</div>

        <div style={{ maxWidth: 860, margin: "0 auto", position: "relative" }}>
          <div className="sobre-grid">

            {/* [1,1] Label + título */}
            <div style={{ paddingBottom: 20 }}>
              <div style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 14 }}>{t.sobre.label}</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: "clamp(26px, 3.5vw, 38px)", letterSpacing: "-1px", lineHeight: 1.2, margin: 0 }}>
                {t.sobre.h2a}<br />
                <span style={{ color: "var(--color-cyan)" }}>{t.sobre.h2b}</span>
              </h2>
            </div>

            {/* [1,2] Subtítulo */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 28, height: 2, background: "var(--color-cyan)", borderRadius: 999, opacity: 0.7, flexShrink: 0 }} />
                <p style={{ fontSize: 15, color: "var(--color-f1)", fontWeight: 600, margin: 0 }}>{t.sobre.subtitle}</p>
              </div>
            </div>

            {/* [2,1] */}
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 28 }}>
              <p style={{ fontSize: 14, color: "var(--color-f3)", lineHeight: 1.85, marginBottom: 16 }}>{t.sobre.p1}</p>
              <p style={{ fontSize: 14, color: "var(--color-f3)", lineHeight: 1.85 }}>{t.sobre.p2}</p>
            </div>

            {/* [2,2] */}
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 28 }}>
              <p style={{ fontSize: 14, color: "var(--color-f3)", lineHeight: 1.85, marginBottom: 16 }}>{t.sobre.p3}</p>
              <p style={{ fontSize: 14, color: "var(--color-f3)", lineHeight: 1.85 }}>{t.sobre.p4}</p>
            </div>
          </div>

          {/* Easter egg divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
            <div style={{ flex: 1, height: "0.5px", background: "var(--color-border)" }} />
            <span style={{ fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-f4)" }}>{t.sobre.divider}</span>
            <div style={{ flex: 1, height: "0.5px", background: "var(--color-border)" }} />
          </div>

          {/* Cards f(x) */}
          <div className="sobre-cards">
            {t.sobre.cards.map(card => (
              <div key={card.label} style={{ background: card.highlight ? "rgba(34,211,238,0.06)" : "var(--color-bg3)", border: `1px solid ${card.highlight ? "rgba(34,211,238,0.2)" : "var(--color-border)"}`, borderRadius: 14, padding: "22px 20px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "clamp(24px, 3vw, 34px)", color: "var(--color-cyan)", lineHeight: 1, marginBottom: 12 }}>{card.symbol}</div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 10 }}>{card.label}</div>
                <p style={{ fontSize: 12, color: card.highlight ? "var(--color-f2)" : "var(--color-f3)", lineHeight: 1.75, margin: 0 }}>{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Fixed point */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 24px", background: "var(--color-bg3)", border: "1px solid var(--color-border)", borderRadius: 12 }}>
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: 20, color: "var(--color-cyan)", flexShrink: 0 }}>f(x) = x</div>
            <div style={{ width: "0.5px", height: 36, background: "var(--color-border)", flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: "var(--color-f4)", lineHeight: 1.7, margin: 0 }}>
              <span style={{ color: "var(--color-f3)" }}>{t.sobre.fixedPointLabel}</span>, {t.sobre.fixedPointDesc}{" "}
              <br />
              <span style={{ color: "var(--color-f2)", display: "inline-block", marginTop: 4 }}>{t.sobre.lifeFixed}</span>{" "}{t.sobre.lifeFixedDesc}
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="funcionalidades" className="section-pad" style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 14 }}>{t.features.label}</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: "clamp(28px, 4vw, 42px)", letterSpacing: "-1px", lineHeight: 1.2 }}>
            {t.features.h2a}<br />
            <span style={{ color: "var(--color-cyan)" }}>{t.features.h2b}</span>
          </h2>
        </div>
        <div className="features-grid">
          {features.map(f => (
            <div
              key={f.title}
              style={{ background: "var(--color-bg2)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 24, transition: "border-color 200ms, transform 200ms" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = f.color + "44"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
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
      <section id="como-funciona" className="section-pad" style={{ background: "var(--color-bg2)", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 14 }}>{t.howItWorks.label}</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-1px", marginBottom: 56 }}>
            {t.howItWorks.h2}
          </h2>
          <div className="steps-grid">
            {t.howItWorks.steps.map((s, i) => (
              <StepCard key={s.step} step={s.step} title={s.title} desc={s.desc} color={s.color} isLast={i === 3} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="precos" className="section-pad" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 14 }}>{t.pricing.label}</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: "-1.5px", lineHeight: 1.15, marginBottom: 16 }}>
              {t.pricing.h2a}<br />
              <span style={{ color: "var(--color-cyan)" }}>{t.pricing.h2b}</span>
            </h2>
            <p style={{ fontSize: 15, color: "var(--color-f3)", lineHeight: 1.75, maxWidth: 420, margin: "0 auto" }}>{t.pricing.p}</p>
          </div>

          <div style={{ maxWidth: 480, margin: "0 auto", background: "var(--color-bg2)", border: "1px solid rgba(34,211,238,0.25)", borderRadius: 24, overflow: "hidden", boxShadow: "0 0 60px rgba(34,211,238,0.06)" }}>
            <div style={{ padding: "36px 36px 28px", borderBottom: "1px solid var(--color-border)", background: "linear-gradient(160deg, rgba(34,211,238,0.06) 0%, transparent 60%)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-f2)", letterSpacing: "0.5px" }}>{t.pricing.planName}</span>
                <span style={{ fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", padding: "3px 10px", borderRadius: 999, background: "rgba(34,211,238,0.1)", color: "var(--color-cyan)", border: "1px solid rgba(34,211,238,0.2)" }}>{t.pricing.planBadge}</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "var(--color-f4)", marginBottom: 6 }}>{t.pricing.currency}</span>
                <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: 56, lineHeight: 1, color: "var(--color-cyan)", letterSpacing: "-2px" }}>XX,xx</span>
                <span style={{ fontSize: 13, color: "var(--color-f4)", marginBottom: 8 }}>{t.pricing.perMonth}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--color-f4)", lineHeight: 1.6, margin: 0 }}>{t.pricing.planDesc}</p>
            </div>

            <div style={{ padding: "28px 36px 32px" }}>
              <div style={{ fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 18 }}>{t.pricing.featLabel}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {t.pricing.features.map(feature => (
                  <div key={feature} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 999, flexShrink: 0, marginTop: 1, background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 6, height: 6, borderRadius: 999, background: "var(--color-cyan)" }} />
                    </div>
                    <span style={{ fontSize: 13, color: "var(--color-f3)", lineHeight: 1.5 }}>{feature}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/login"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 32, padding: "14px 0", background: "var(--color-cyan)", color: "#083344", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none", transition: "opacity 150ms" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                {t.pricing.cta} <IconArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="section-pad" style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "var(--color-f4)", marginBottom: 14 }}>{t.faq.label}</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-1px" }}>
            {t.faq.h2}
          </h2>
        </div>
        <FAQList items={t.faq.items} />
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: "0 16px 16px" }}>
        <div style={{ background: "var(--color-bg2)", border: "1px solid var(--color-border)", borderRadius: 32, overflow: "hidden" }}>

          <div className="footer-top">
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: 18 }}>
              Ly<span style={{ color: "var(--color-cyan)" }}>fx</span>
              <span style={{ fontFamily: "var(--font-body)", fontStyle: "normal", fontSize: 11, color: "var(--color-f4)", marginLeft: 8, letterSpacing: "1px" }}>LIFE FIXED</span>
            </div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid var(--color-border)", borderRadius: 8, padding: "7px 14px", fontSize: 11, color: "var(--color-f3)", cursor: "pointer", letterSpacing: "0.5px", textTransform: "uppercase", transition: "border-color 150ms, color 150ms" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-cyan)"; e.currentTarget.style.color = "var(--color-cyan)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-f3)"; }}
            >
              {t.footer.backToTop}
            </button>
            <div className="footer-version">
              v{version} · © 2026 Lyfx<br />
              <span style={{ opacity: 0.6 }}>{t.footer.rights}</span>
            </div>
          </div>

          {/* Marquee gigante */}
          <div style={{ overflow: "hidden", padding: "18px 0 20px" }}>
            <div style={{ display: "flex", width: "max-content", animation: "marquee 22s linear infinite", whiteSpace: "nowrap", willChange: "transform" }}>
              {[0, 1].map(i => (
                <span key={i} style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 700, fontSize: "clamp(56px, 9vw, 110px)", letterSpacing: "-2px", lineHeight: 1, color: "var(--color-f1)", opacity: 0.07, userSelect: "none", flexShrink: 0 }}>
                  {t.footer.marquee}&nbsp;&nbsp;·&nbsp;&nbsp;
                </span>
              ))}
            </div>
          </div>

          <div style={{ height: 2, background: "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.5) 40%, rgba(34,211,238,0.7) 50%, rgba(34,211,238,0.5) 60%, transparent 100%)" }} />
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

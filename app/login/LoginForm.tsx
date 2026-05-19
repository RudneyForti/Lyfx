"use client";

import { useState, useTransition } from "react";
import { IconLogin, IconX, IconEye, IconEyeOff, IconBrain, IconSend, IconLoader2 } from "@tabler/icons-react";
import { setup, login } from "./actions";

interface Props {
  hasUser: boolean;
  monthLabel: string; // "Maio 2026"
}

/* ── helpers ── */
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div
      className={className}
      style={{ animation: `fadeUp 0.55s ${delay}s ease both` }}
    >
      {children}
    </div>
  );
}

function Field({
  id, label, type = "text", placeholder, value, onChange, icon, rightSlot, autoComplete,
}: {
  id: string; label: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  icon: React.ReactNode; rightSlot?: React.ReactNode; autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-medium text-[var(--color-f2)] flex items-center gap-1.5">
        {label}
      </label>
      <div className="relative group/inp">
        <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[var(--color-f4)] group-focus-within/inp:text-[var(--color-cyan)] transition-colors duration-150 pointer-events-none z-10 flex">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-[44px] bg-[var(--color-bg3)] border border-[rgba(255,255,255,0.13)] rounded-[8px] pl-10 pr-10 text-[13px] text-[var(--color-f1)] outline-none transition-all duration-150 placeholder:text-[var(--color-f4)] hover:border-[rgba(255,255,255,0.22)] focus:border-[rgba(34,211,238,0.28)] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)] focus:bg-[rgba(17,17,17,0.9)]"
        />
        {rightSlot && (
          <span className="absolute right-[13px] top-1/2 -translate-y-1/2 z-10">
            {rightSlot}
          </span>
        )}
      </div>
    </div>
  );
}

export function LoginForm({ hasUser, monthLabel }: Props) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"login" | "setup">(hasUser ? "login" : "setup");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });
  const [forgotOpen, setForgotOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  function switchMode(next: "login" | "setup") {
    setMode(next);
    setError("");
    setName("");
    setEmail("");
    setPassword("");
    setConfirm("");
    setSuccess(false);
  }

  function showToast(msg: string) {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 3200);
  }

  function shake() {
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "setup") {
      if (!name.trim()) { setError("Nome obrigatório."); shake(); return; }
      if (!email.trim()) { setError("E-mail obrigatório."); shake(); return; }
      if (password.length < 6) { setError("Senha deve ter ao menos 6 caracteres."); shake(); return; }
      if (password !== confirm) { setError("As senhas não coincidem."); shake(); return; }
      startTransition(async () => {
        const result = await setup({ name, email, password });
        if (result?.error) { setError(result.error); shake(); }
      });
    } else {
      if (!email.trim()) { setError("E-mail obrigatório."); shake(); return; }
      if (!password) { setError("Senha obrigatória."); shake(); return; }
      startTransition(async () => {
        const result = await login({ email, password });
        if (result?.error) { setError(result.error); shake(); }
        else setSuccess(true);
      });
    }
  }

  /* ── Left panel content ── */
  const leftHeading = mode === "login"
    ? (<>Bem-vindo<br />de <em className="text-[var(--color-cyan)] not-italic">volta.</em></>)
    : (<>Crie sua<br /><em className="text-[var(--color-cyan)] not-italic">conta.</em></>);

  const leftSub = mode === "login"
    ? "Sua função continua rodando enquanto você estava fora. Entre e veja onde você está na curva."
    : "Comece a transformar o caos financeiro em uma equação com solução.";

  const kpis = [
    { val: "68%", lbl: "Reserva" },
    { val: "R$ 4,8k", lbl: "Saldo" },
    { val: "4", lbl: "Metas ativas" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", overflow: "hidden" }}>

      {/* ── LEFT PANEL ── */}
      <div
        className="flex-1 flex-col items-center justify-center p-12 relative overflow-hidden hidden md:flex"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(34,211,238,0.12) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        {/* Radial vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, rgba(12,12,12,0.92) 100%)",
          }}
        />

        {/* f(x) watermark */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none font-[family-name:var(--font-display)] italic font-bold leading-none whitespace-nowrap z-0"
          style={{ fontSize: "clamp(100px, 18vw, 200px)", color: "rgba(34,211,238,0.05)" }}
        >
          f(x)
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-[400px] flex flex-col items-center">
          <FadeUp delay={0}>
            <div className="text-[11px] tracking-[3px] uppercase text-[var(--color-f4)] mb-4">
              Life Fixed · {monthLabel}
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <h1
              className="font-[family-name:var(--font-display)] italic font-bold text-[var(--color-f1)] mb-4"
              style={{ fontSize: "clamp(28px, 4vw, 42px)", letterSpacing: "-1.5px", lineHeight: 1.15 }}
            >
              {leftHeading}
            </h1>
          </FadeUp>

          <FadeUp delay={0.2}>
            <p className="text-[14px] text-[var(--color-f3)] leading-[1.75] max-w-[300px] mb-9">
              {leftSub}
            </p>
          </FadeUp>

          <FadeUp delay={0.3} className="w-full max-w-[340px]">
            <div className="grid grid-cols-3 gap-2.5">
              {kpis.map(({ val, lbl }) => (
                <div
                  key={lbl}
                  className="rounded-[12px] p-3.5 text-center border border-[rgba(255,255,255,0.13)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(34,211,238,0.28)] cursor-default"
                  style={{ background: "rgba(17,17,17,0.8)" }}
                >
                  <div className="font-[family-name:var(--font-display)] italic font-bold text-[20px] text-[var(--color-cyan)] tracking-tight mb-0.5">
                    {val}
                  </div>
                  <div className="text-[9px] tracking-[1px] uppercase text-[var(--color-f4)]">{lbl}</div>
                </div>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.4}>
            <div
              className="mt-5 flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(34,211,238,0.25)] text-[12px] text-[var(--color-f3)] max-w-[340px] text-left"
              style={{ background: "rgba(34,211,238,0.06)" }}
            >
              <IconBrain size={15} className="text-[var(--color-cyan)] flex-shrink-0" />
              <span>Você está 3 meses mais perto da meta de reserva do que em janeiro.</span>
            </div>
          </FadeUp>
        </div>
      </div>

      {/* ── VERTICAL DIVIDER ── */}
      <div
        className="hidden md:block flex-shrink-0"
        style={{
          width: "0.5px",
          background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.13) 20%, rgba(255,255,255,0.13) 80%, transparent)",
        }}
      />

      {/* ── RIGHT PANEL ── */}
      <div
        className="flex flex-col justify-center relative overflow-y-auto w-full md:w-[420px] md:min-w-[420px] px-11 py-12"
        style={{ background: "var(--color-bg2)" }}
      >
        {/* Logo */}
        <FadeUp delay={0} className="mb-9">
          <div
            className="font-[family-name:var(--font-display)] italic font-bold text-[var(--color-f1)] leading-none"
            style={{ fontSize: 32, letterSpacing: "-1px" }}
          >
            Ly<span className="text-[var(--color-cyan)]">fx</span>
          </div>
          <div className="text-[9px] tracking-[3px] uppercase text-[var(--color-f4)] mt-1">Life Fixed</div>
        </FadeUp>

        {/* Title */}
        <FadeUp delay={0.05}>
          <h2 className="text-[22px] font-semibold text-[var(--color-f1)] mb-1" style={{ letterSpacing: "-0.4px" }}>
            {mode === "login" ? "Entrar na sua conta" : "Criar sua conta"}
          </h2>
        </FadeUp>

        <FadeUp delay={0.1} className="mb-7">
          <p className="text-[13px] text-[var(--color-f3)]">
            {mode === "login"
              ? <span>Não tem conta? <button type="button" onClick={() => switchMode("setup")} className="text-[var(--color-cyan)] cursor-pointer hover:opacity-80 transition-opacity bg-none border-none p-0">Criar conta</button></span>
              : <span>Já tem conta? <button type="button" onClick={() => switchMode("login")} className="text-[var(--color-cyan)] cursor-pointer hover:opacity-80 transition-opacity bg-none border-none p-0">Entrar</button></span>
            }
          </p>
        </FadeUp>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <FadeUp delay={0.15} className="flex flex-col gap-3.5 mb-4">

            {/* Name — setup only */}
            {mode === "setup" && (
              <Field
                id="name" label="Nome" placeholder="Como quer ser chamado?"
                value={name} onChange={setName}
                autoComplete="name"
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}
              />
            )}

            {/* E-mail */}
            <Field
              id="email" label="E-mail" type="email" placeholder="seu@email.com"
              value={email} onChange={setEmail}
              autoComplete="email"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>}
            />

            {/* Password */}
            <Field
              id="password" label="Senha"
              type={showPw ? "text" : "password"}
              placeholder={mode === "login" ? "••••••••" : "Mínimo 6 caracteres"}
              value={password} onChange={setPassword}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              rightSlot={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw(!showPw)}
                  className="text-[var(--color-f4)] hover:text-[var(--color-f2)] transition-colors cursor-pointer flex"
                >
                  {showPw ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                </button>
              }
            />

            {/* Confirm — setup only */}
            {mode === "setup" && (
              <Field
                id="confirm" label="Confirmar senha"
                type={showPw ? "text" : "password"}
                placeholder="Repita a senha"
                value={confirm} onChange={setConfirm}
                autoComplete="new-password"
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              />
            )}
          </FadeUp>

          {/* Remember + Forgot — login only */}
          {mode === "login" && (
            <FadeUp delay={0.2} className="flex items-center justify-between mb-5">
              <button
                type="button"
                onClick={() => setRemember(!remember)}
                className="flex items-center gap-2 cursor-pointer text-[12px] text-[var(--color-f3)] hover:text-[var(--color-f2)] transition-colors select-none"
              >
                <span
                  className="w-[17px] h-[17px] rounded-[4px] border flex items-center justify-center flex-shrink-0 transition-all duration-150"
                  style={{
                    background: remember ? "var(--color-cyan)" : "var(--color-bg4)",
                    borderColor: remember ? "var(--color-cyan)" : "rgba(255,255,255,0.13)",
                  }}
                >
                  {remember && (
                    <span
                      style={{
                        display: "block",
                        width: 9,
                        height: 5,
                        borderLeft: "1.5px solid #083344",
                        borderBottom: "1.5px solid #083344",
                        transform: "rotate(-45deg) translateY(-1px)",
                      }}
                    />
                  )}
                </span>
                Lembrar de mim
              </button>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-[12px] text-[var(--color-cyan)] hover:opacity-80 transition-opacity cursor-pointer"
              >
                Esqueci a senha
              </button>
            </FadeUp>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-red)] mb-3">
              <IconX size={11} />{error}
            </div>
          )}

          {/* CTA */}
          <FadeUp delay={0.25}>
            <button
              type="submit"
              disabled={isPending}
              className="w-full h-[44px] rounded-[8px] text-[14px] font-semibold flex items-center justify-center gap-2 transition-all duration-150 mb-4 cursor-pointer border-none disabled:opacity-70"
              onAnimationEnd={() => setShaking(false)}
              style={{
                background: success ? "#A3E635" : "var(--color-cyan)",
                color: success ? "#1a3300" : "#083344",
                animation: shaking ? "shake 0.35s ease" : undefined,
              } as React.CSSProperties}
            >
              {isPending ? (
                <><IconLoader2 size={17} className="animate-spin" /> Entrando…</>
              ) : success ? (
                <><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Bem-vindo de volta!</>
              ) : (
                <><IconLogin size={17} /> {mode === "login" ? "Entrar na Lyfx" : "Criar conta"}</>
              )}
            </button>
          </FadeUp>

          {/* OR + Social — login only */}
          {mode === "login" && (
            <>
              <FadeUp delay={0.3} className="flex items-center gap-3 mb-4">
                <span className="flex-1 h-px bg-[rgba(255,255,255,0.13)]" />
                <span className="text-[11px] text-[var(--color-f4)] whitespace-nowrap">ou continue com</span>
                <span className="flex-1 h-px bg-[rgba(255,255,255,0.13)]" />
              </FadeUp>

              <FadeUp delay={0.35} className="flex flex-col gap-2 mb-6">
                {[
                  {
                    label: "Continuar com Google",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    ),
                  },
                  {
                    label: "Continuar com Microsoft",
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 21 21">
                        <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                        <rect x="11" y="1" width="9" height="9" fill="#00a4ef"/>
                        <rect x="1" y="11" width="9" height="9" fill="#7fba00"/>
                        <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                      </svg>
                    ),
                  },
                ].map(({ label, icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => showToast("Login social em breve!")}
                    className="w-full h-[44px] rounded-[8px] text-[13px] text-[var(--color-f2)] flex items-center gap-2.5 px-4 border border-[rgba(255,255,255,0.13)] bg-[var(--color-bg3)] hover:bg-[var(--color-bg4)] hover:border-[rgba(255,255,255,0.22)] hover:text-[var(--color-f1)] transition-all cursor-pointer"
                  >
                    <span className="flex-shrink-0">{icon}</span>
                    {label}
                  </button>
                ))}
              </FadeUp>
            </>
          )}
        </form>

        {/* Footer */}
        <FadeUp delay={0.4}>
          <p className="text-[11px] text-[var(--color-f4)] text-center leading-[1.8]">
            Dados armazenados localmente no seu dispositivo.<br />
            <button type="button" className="text-[var(--color-cyan)] hover:opacity-80 cursor-pointer bg-none border-none p-0 text-[11px]" onClick={() => showToast("Termos em breve.")}>Termos de uso</button>
            {" · "}
            <button type="button" className="text-[var(--color-cyan)] hover:opacity-80 cursor-pointer bg-none border-none p-0 text-[11px]" onClick={() => showToast("Política em breve.")}>Privacidade</button>
          </p>
        </FadeUp>
      </div>

      {/* ── TOAST ── */}
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--color-bg3)] border border-[rgba(255,255,255,0.13)] rounded-full px-5 py-2.5 text-[12px] text-[var(--color-f2)] flex items-center gap-2 whitespace-nowrap pointer-events-none z-50 transition-all duration-300"
        style={{
          transform: `translateX(-50%) translateY(${toast.show ? "0" : "80px"})`,
          opacity: toast.show ? 1 : 0,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-cyan)] flex-shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        {toast.msg}
      </div>

      {/* ── FORGOT PASSWORD MODAL ── */}
      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setForgotOpen(false)}
        >
          <div className="bg-[var(--color-bg2)] border border-[rgba(255,255,255,0.13)] rounded-[18px] p-7 w-[360px] shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[16px] font-semibold text-[var(--color-f1)]">Recuperar acesso</span>
              <button
                onClick={() => setForgotOpen(false)}
                className="w-7 h-7 rounded-[6px] bg-[var(--color-bg4)] border border-[rgba(255,255,255,0.07)] flex items-center justify-center text-[var(--color-f3)] hover:bg-[var(--color-bg5)] hover:text-[var(--color-f1)] transition-all cursor-pointer"
              >
                <IconX size={14} />
              </button>
            </div>
            <p className="text-[13px] text-[var(--color-f3)] leading-[1.7] mb-5">
              Como o Lyfx roda localmente, não há envio de e-mail. Entre com outra senha ou redefina diretamente na tela de perfil após recuperar o acesso via banco de dados.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setForgotOpen(false)}
                className="px-4 py-2 rounded-[8px] text-[13px] text-[var(--color-f2)] border border-[rgba(255,255,255,0.13)] hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer"
              >
                Fechar
              </button>
              <button
                onClick={() => { setForgotOpen(false); showToast("Acesse /profile após entrar para redefinir."); }}
                className="px-4 py-2 rounded-[8px] text-[13px] font-semibold bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <IconSend size={13} />
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

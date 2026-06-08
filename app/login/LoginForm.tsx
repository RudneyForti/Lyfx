"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { IconLogin, IconX, IconEye, IconEyeOff, IconBrain, IconSend, IconLoader2 } from "@tabler/icons-react";
import { setup, login } from "./actions";
import { TurnstileWidget } from "@/components/login/TurnstileWidget";
import { PasswordStrengthBar } from "@/components/auth/PasswordStrengthBar";
import { validatePasswordStrict } from "@/lib/password-strength";

/* ── i18n ── */
type Lang = "pt" | "en" | "es";

const MONTHS: Record<Lang, string[]> = {
  pt: ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  es: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
};

const TRANSLATIONS: Record<Lang, {
  headLoginL1: string; headLoginL2: string;
  headSetupL1: string; headSetupL2: string;
  subLogin: string; subSetup: string;
  kpiReserve: string; kpiBalance: string; kpiGoals: string;
  insight: string;
  back: string;
  titleLogin: string; titleSetup: string;
  subLinkLogin: string; subLinkLoginCta: string;
  subLinkSetup: string; subLinkSetupCta: string;
  labelName: string; placeholderName: string;
  labelEmail: string;
  labelPassword: string; phPasswordLogin: string; phPasswordSetup: string;
  labelConfirm: string; phConfirm: string;
  remember: string; forgot: string;
  errName: string; errEmail: string; errPassword: string;
  errPasswordMin: string; errPasswordMatch: string;
  submitting: string; successMsg: string;
  ctaLogin: string; ctaSetup: string;
  orContinue: string; continueGoogle: string; continueMicrosoft: string;
  accessStudio: string;
  footerStorage: string; footerTerms: string; footerPrivacy: string;
  toastSocial: string; toastTerms: string; toastPrivacy: string; toastProfile: string;
  forgotTitle: string; forgotBody: string; forgotClose: string; forgotConfirm: string;
}> = {
  pt: {
    headLoginL1: "Bem-vindo",
    headLoginL2: "de volta.",
    headSetupL1: "Crie sua",
    headSetupL2: "conta.",
    subLogin: "Sua função continua rodando enquanto você estava fora. Entre e veja onde você está na curva.",
    subSetup: "Comece a transformar o caos financeiro em uma equação com solução.",
    kpiReserve: "Reserva",
    kpiBalance: "Saldo",
    kpiGoals: "Metas ativas",
    insight: "Você está 3 meses mais perto da meta de reserva do que em janeiro.",
    back: "Início",
    titleLogin: "Entrar na sua conta",
    titleSetup: "Criar sua conta",
    subLinkLogin: "Não tem conta?",
    subLinkLoginCta: "Criar conta",
    subLinkSetup: "Já tem conta?",
    subLinkSetupCta: "Entrar",
    labelName: "Nome",
    placeholderName: "Como quer ser chamado?",
    labelEmail: "E-mail",
    labelPassword: "Senha",
    phPasswordLogin: "••••••••",
    phPasswordSetup: "Mín. 8 chars, maiúscula, número e especial",
    labelConfirm: "Confirmar senha",
    phConfirm: "Repita a senha",
    remember: "Lembrar de mim",
    forgot: "Esqueci a senha",
    errName: "Nome obrigatório.",
    errEmail: "E-mail obrigatório.",
    errPassword: "Senha obrigatória.",
    errPasswordMin: "Senha não atende aos requisitos de segurança.",
    errPasswordMatch: "As senhas não coincidem.",
    submitting: "Entrando…",
    successMsg: "Bem-vindo de volta!",
    ctaLogin: "Entrar na Lyfx",
    ctaSetup: "Criar conta",
    orContinue: "ou continue com",
    continueGoogle: "Continuar com Google",
    continueMicrosoft: "Continuar com Microsoft",
    accessStudio: "Acessar Studio",
    footerStorage: "Dados armazenados localmente no seu dispositivo.",
    footerTerms: "Termos de uso",
    footerPrivacy: "Privacidade",
    toastSocial: "Login social em breve!",
    toastTerms: "Termos em breve.",
    toastPrivacy: "Política em breve.",
    toastProfile: "Acesse /profile após entrar para redefinir.",
    forgotTitle: "Recuperar acesso",
    forgotBody: "Como o Lyfx roda localmente, não há envio de e-mail. Entre com outra senha ou redefina diretamente na tela de perfil após recuperar o acesso via banco de dados.",
    forgotClose: "Fechar",
    forgotConfirm: "Entendido",
  },
  en: {
    headLoginL1: "Welcome",
    headLoginL2: "back.",
    headSetupL1: "Create your",
    headSetupL2: "account.",
    subLogin: "Your function kept running while you were away. Sign in and see where you stand on the curve.",
    subSetup: "Start transforming financial chaos into a solvable equation.",
    kpiReserve: "Reserve",
    kpiBalance: "Balance",
    kpiGoals: "Active goals",
    insight: "You're 3 months closer to your savings goal than in January.",
    back: "Home",
    titleLogin: "Sign in to your account",
    titleSetup: "Create your account",
    subLinkLogin: "Don't have an account?",
    subLinkLoginCta: "Create account",
    subLinkSetup: "Already have an account?",
    subLinkSetupCta: "Sign in",
    labelName: "Name",
    placeholderName: "What should we call you?",
    labelEmail: "E-mail",
    labelPassword: "Password",
    phPasswordLogin: "••••••••",
    phPasswordSetup: "Min. 8 chars, uppercase, number & special",
    labelConfirm: "Confirm password",
    phConfirm: "Repeat password",
    remember: "Remember me",
    forgot: "Forgot password",
    errName: "Name is required.",
    errEmail: "Email is required.",
    errPassword: "Password is required.",
    errPasswordMin: "Password does not meet security requirements.",
    errPasswordMatch: "Passwords don't match.",
    submitting: "Signing in…",
    successMsg: "Welcome back!",
    ctaLogin: "Sign in to Lyfx",
    ctaSetup: "Create account",
    orContinue: "or continue with",
    continueGoogle: "Continue with Google",
    continueMicrosoft: "Continue with Microsoft",
    accessStudio: "Access Studio",
    footerStorage: "Data stored locally on your device.",
    footerTerms: "Terms of use",
    footerPrivacy: "Privacy",
    toastSocial: "Social login coming soon!",
    toastTerms: "Terms coming soon.",
    toastPrivacy: "Policy coming soon.",
    toastProfile: "Go to /profile after signing in to reset.",
    forgotTitle: "Recover access",
    forgotBody: "Since Lyfx runs locally, there's no email recovery. Sign in with another password or reset it directly on the profile page after recovering access via the database.",
    forgotClose: "Close",
    forgotConfirm: "Got it",
  },
  es: {
    headLoginL1: "Bienvenido",
    headLoginL2: "de vuelta.",
    headSetupL1: "Crea tu",
    headSetupL2: "cuenta.",
    subLogin: "Tu función siguió ejecutándose mientras estabas fuera. Inicia sesión y ve dónde estás en la curva.",
    subSetup: "Empieza a transformar el caos financiero en una ecuación con solución.",
    kpiReserve: "Reserva",
    kpiBalance: "Saldo",
    kpiGoals: "Metas activas",
    insight: "Estás 3 meses más cerca de tu meta de ahorro que en enero.",
    back: "Inicio",
    titleLogin: "Inicia sesión en tu cuenta",
    titleSetup: "Crea tu cuenta",
    subLinkLogin: "¿No tienes cuenta?",
    subLinkLoginCta: "Crear cuenta",
    subLinkSetup: "¿Ya tienes cuenta?",
    subLinkSetupCta: "Iniciar sesión",
    labelName: "Nombre",
    placeholderName: "¿Cómo quieres que te llamemos?",
    labelEmail: "Correo",
    labelPassword: "Contraseña",
    phPasswordLogin: "••••••••",
    phPasswordSetup: "Mín. 8 chars, mayúscula, número y especial",
    labelConfirm: "Confirmar contraseña",
    phConfirm: "Repite la contraseña",
    remember: "Recuérdame",
    forgot: "Olvidé mi contraseña",
    errName: "El nombre es obligatorio.",
    errEmail: "El correo es obligatorio.",
    errPassword: "La contraseña es obligatoria.",
    errPasswordMin: "La contraseña no cumple los requisitos de seguridad.",
    errPasswordMatch: "Las contraseñas no coinciden.",
    submitting: "Entrando…",
    successMsg: "¡Bienvenido de vuelta!",
    ctaLogin: "Ingresar a Lyfx",
    ctaSetup: "Crear cuenta",
    orContinue: "o continúa con",
    continueGoogle: "Continuar con Google",
    continueMicrosoft: "Continuar con Microsoft",
    accessStudio: "Acceder al Studio",
    footerStorage: "Datos almacenados localmente en tu dispositivo.",
    footerTerms: "Términos de uso",
    footerPrivacy: "Privacidad",
    toastSocial: "Inicio de sesión social próximamente.",
    toastTerms: "Términos próximamente.",
    toastPrivacy: "Política próximamente.",
    toastProfile: "Ve a /profile después de iniciar sesión para restablecer.",
    forgotTitle: "Recuperar acceso",
    forgotBody: "Como Lyfx funciona localmente, no hay recuperación por correo. Inicia sesión con otra contraseña o restablécela directamente en tu perfil tras recuperar el acceso desde la base de datos.",
    forgotClose: "Cerrar",
    forgotConfirm: "Entendido",
  },
};

interface Props {
  hasUser: boolean;
  monthIndex: number;
  year: number;
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
          className="w-full h-[44px] bg-[var(--color-bg3)] border border-[rgba(255,255,255,0.13)] rounded-[12px] pl-10 pr-10 text-[13px] text-[var(--color-f1)] outline-none transition-all duration-150 placeholder:text-[var(--color-f4)] hover:border-[rgba(255,255,255,0.22)] focus:border-[rgba(34,211,238,0.28)] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)] focus:bg-[rgba(17,17,17,0.9)]"
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

export function LoginForm({ hasUser, monthIndex, year }: Props) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"login" | "setup">(hasUser ? "login" : "setup");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  // CS-13: ler rota original para redirecionar após login
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? undefined;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: "" });
  const [forgotOpen, setForgotOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  // CS-32: estados de rate limiting
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [blockedMinutes, setBlockedMinutes] = useState<number | null>(null);

  // CS-16: detectar idioma do localStorage (set pela LandingPage)
  const [lang, setLang] = useState<Lang>("pt");
  useEffect(() => {
    const stored = localStorage.getItem("lyfx-lang");
    if (stored === "pt" || stored === "en" || stored === "es") setLang(stored);
  }, []);

  const t = TRANSLATIONS[lang];
  const monthLabel = `${MONTHS[lang][monthIndex]} ${year}`;

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
      if (!name.trim()) { setError(t.errName); shake(); return; }
      if (!email.trim()) { setError(t.errEmail); shake(); return; }
      // CS-33: validação de política de senha forte
      const pwError = validatePasswordStrict(password);
      if (pwError) { setError(pwError); shake(); return; }
      if (password !== confirm) { setError(t.errPasswordMatch); shake(); return; }
      startTransition(async () => {
        const result = await setup({ name, email, password });
        if (result?.error) { setError(result.error); shake(); }
      });
    } else {
      if (!email.trim()) { setError(t.errEmail); shake(); return; }
      if (!password) { setError(t.errPassword); shake(); return; }
      // CS-32: se CAPTCHA obrigatório mas token ainda não obtido, aguardar
      if (captchaRequired && !captchaToken) {
        setError("Complete o desafio de segurança para continuar.");
        shake();
        return;
      }
      startTransition(async () => {
        // CS-13: passa remember e redirectTo para a action
        // CS-32: passa captchaToken quando disponível
        const result = await login({
          email,
          password,
          remember,
          redirectTo,
          captchaToken: captchaToken ?? undefined,
        });
        if (!result) return; // redirect aconteceu
        if ("blocked" in result && result.blocked) {
          setBlockedMinutes(result.retryAfterMinutes);
          setError("");
          return;
        }
        if ("captchaRequired" in result && result.captchaRequired) {
          setCaptchaRequired(true);
          setCaptchaToken(null);
          if ("captchaError" in result && result.captchaError) {
            setError("Desafio de segurança inválido ou expirado. Tente novamente.");
            shake();
          }
          return;
        }
        if (result?.error) { setError(result.error); shake(); }
        else setSuccess(true);
      });
    }
  }

  /* ── Left panel content ── */
  const leftHeading = mode === "login"
    ? (<>{t.headLoginL1}<br /><em className="text-[var(--color-cyan)] not-italic">{t.headLoginL2}</em></>)
    : (<>{t.headSetupL1}<br /><em className="text-[var(--color-cyan)] not-italic">{t.headSetupL2}</em></>);

  const leftSub = mode === "login" ? t.subLogin : t.subSetup;

  const kpis = [
    { val: "68%", lbl: t.kpiReserve },
    { val: "R$ 4,8k", lbl: t.kpiBalance },
    { val: "4", lbl: t.kpiGoals },
  ];

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      backgroundImage: "radial-gradient(circle, rgba(34,211,238,0.07) 1px, transparent 1px)",
      backgroundSize: "32px 32px",
    }}>

      {/* ── LEFT PANEL ── */}
      <div
        className="flex-1 flex-col items-center justify-center p-12 relative overflow-hidden hidden md:flex"
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
              <span>{t.insight}</span>
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
        className="flex flex-col items-center justify-center relative overflow-hidden w-full md:w-[480px] md:min-w-[480px] px-6"
        style={{ background: "transparent" }}
      >
        {/* Floating card */}
        <div
          className="w-full max-w-[400px] relative"
          style={{
            background: "rgba(12,12,12,0.82)",
            backdropFilter: "blur(24px) saturate(160%)",
            WebkitBackdropFilter: "blur(24px) saturate(160%)",
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "22px 36px 18px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          }}
        >
        {/* back to landing */}
        <Link
          href="/"
          className="flex items-center gap-1.5 text-[11px] text-[var(--color-f4)] hover:text-[var(--color-f2)] transition-colors no-underline mb-3"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          {t.back}
        </Link>

        {/* Logo */}
        <FadeUp delay={0} className="mb-4 flex justify-center">
          <div
            className="font-[family-name:var(--font-display)] italic font-bold text-[var(--color-f1)] leading-none"
            style={{ fontSize: 32, letterSpacing: "-1px" }}
          >
            Ly<span className="text-[var(--color-cyan)]">fx</span>
          </div>
        </FadeUp>

        {/* Title */}
        <FadeUp delay={0.05}>
          <h2 className="text-[20px] font-semibold text-[var(--color-f1)] mb-1" style={{ letterSpacing: "-0.4px" }}>
            {mode === "login" ? t.titleLogin : t.titleSetup}
          </h2>
        </FadeUp>

        <FadeUp delay={0.1} className="mb-4">
          <p className="text-[13px] text-[var(--color-f3)]">
            {mode === "login"
              ? <span>{t.subLinkLogin}{" "}<button type="button" onClick={() => switchMode("setup")} className="text-[var(--color-cyan)] cursor-pointer hover:opacity-80 transition-opacity bg-none border-none p-0">{t.subLinkLoginCta}</button></span>
              : <span>{t.subLinkSetup}{" "}<button type="button" onClick={() => switchMode("login")} className="text-[var(--color-cyan)] cursor-pointer hover:opacity-80 transition-opacity bg-none border-none p-0">{t.subLinkSetupCta}</button></span>
            }
          </p>
        </FadeUp>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <FadeUp delay={0.15} className="flex flex-col gap-3 mb-3">

            {/* Name — setup only */}
            {mode === "setup" && (
              <Field
                id="name" label={t.labelName} placeholder={t.placeholderName}
                value={name} onChange={setName}
                autoComplete="name"
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}
              />
            )}

            {/* E-mail */}
            <Field
              id="email" label={t.labelEmail} type="email" placeholder="seu@email.com"
              value={email} onChange={setEmail}
              autoComplete="email"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>}
            />

            {/* Password */}
            <Field
              id="password" label={t.labelPassword}
              type={showPw ? "text" : "password"}
              placeholder={mode === "login" ? t.phPasswordLogin : t.phPasswordSetup}
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

            {/* CS-33: Barra de força — setup only, aparece quando há conteúdo */}
            {mode === "setup" && (
              <PasswordStrengthBar password={password} />
            )}

            {/* Confirm — setup only */}
            {mode === "setup" && (
              <Field
                id="confirm" label={t.labelConfirm}
                type={showPw ? "text" : "password"}
                placeholder={t.phConfirm}
                value={confirm} onChange={setConfirm}
                autoComplete="new-password"
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              />
            )}
          </FadeUp>

          {/* Remember + Forgot — login only */}
          {mode === "login" && (
            <FadeUp delay={0.2} className="flex items-center justify-between mb-3">
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
                {t.remember}
              </button>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-[12px] text-[var(--color-cyan)] hover:opacity-80 transition-opacity cursor-pointer"
              >
                {t.forgot}
              </button>
            </FadeUp>
          )}

          {/* CS-32: Banner de IP bloqueado */}
          {blockedMinutes !== null && (
            <div className="rounded-[10px] bg-[var(--color-red-dim)] border border-[var(--color-red-border)] px-4 py-3 mb-3 text-center">
              <p className="text-[12px] text-[var(--color-red)] font-medium mb-0.5">
                Acesso temporariamente bloqueado
              </p>
              <p className="text-[11px] text-[var(--color-f3)]">
                Muitas tentativas incorretas. Tente novamente em{" "}
                <span className="text-[var(--color-f1)] font-semibold">{blockedMinutes} min</span>.
              </p>
            </div>
          )}

          {/* CS-32: Desafio CAPTCHA Turnstile */}
          {captchaRequired && !blockedMinutes && (
            <div className="rounded-[10px] bg-[var(--color-bg3)] border border-[var(--color-border2)] px-4 py-4 mb-3">
              <TurnstileWidget
                onToken={(token) => {
                  setCaptchaToken(token);
                  setError("");
                }}
                onExpire={() => setCaptchaToken(null)}
              />
            </div>
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
              disabled={isPending || blockedMinutes !== null}
              className="w-full h-[44px] rounded-full text-[14px] font-semibold flex items-center justify-center gap-2 transition-all duration-150 mb-3 cursor-pointer border-none disabled:opacity-70"
              onAnimationEnd={() => setShaking(false)}
              style={{
                background: success ? "#A3E635" : "var(--color-cyan)",
                color: success ? "#1a3300" : "#083344",
                animation: shaking ? "shake 0.35s ease" : undefined,
              } as React.CSSProperties}
            >
              {isPending ? (
                <><IconLoader2 size={17} className="animate-spin" /> {t.submitting}</>
              ) : success ? (
                <><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> {t.successMsg}</>
              ) : (
                <><IconLogin size={17} /> {mode === "login" ? t.ctaLogin : t.ctaSetup}</>
              )}
            </button>
          </FadeUp>

          {/* OR + Social — login only */}
          {mode === "login" && (
            <>
              <FadeUp delay={0.3} className="flex items-center gap-3 mb-3">
                <span className="flex-1 h-px bg-[rgba(255,255,255,0.13)]" />
                <span className="text-[11px] text-[var(--color-f4)] whitespace-nowrap">{t.orContinue}</span>
                <span className="flex-1 h-px bg-[rgba(255,255,255,0.13)]" />
              </FadeUp>

              <FadeUp delay={0.35} className="flex flex-col gap-2 mb-3">
                {[
                  {
                    label: t.continueGoogle,
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
                    label: t.continueMicrosoft,
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
                    onClick={() => showToast(t.toastSocial)}
                    className="w-full h-[44px] rounded-[12px] text-[13px] text-[var(--color-f2)] flex items-center gap-2.5 px-4 border border-[rgba(255,255,255,0.13)] bg-[var(--color-bg3)] hover:bg-[var(--color-bg4)] hover:border-[rgba(255,255,255,0.22)] hover:text-[var(--color-f1)] transition-all cursor-pointer"
                  >
                    <span className="flex-shrink-0">{icon}</span>
                    {label}
                  </button>
                ))}
              </FadeUp>
              <FadeUp delay={0.4} className="flex justify-center mb-1">
                <Link
                  href="/studio"
                  className="text-[10px] text-[var(--color-f4)] hover:text-[var(--color-f3)] transition-colors no-underline tracking-wide"
                >
                  {t.accessStudio}
                </Link>
              </FadeUp>
            </>
          )}
        </form>

        {/* Footer */}
        <FadeUp delay={0.4}>
          <p className="text-[11px] text-[var(--color-f4)] text-center leading-[1.8]">
            {t.footerStorage}<br />
            <button type="button" className="text-[var(--color-cyan)] hover:opacity-80 cursor-pointer bg-none border-none p-0 text-[11px]" onClick={() => showToast(t.toastTerms)}>{t.footerTerms}</button>
            {" · "}
            <button type="button" className="text-[var(--color-cyan)] hover:opacity-80 cursor-pointer bg-none border-none p-0 text-[11px]" onClick={() => showToast(t.toastPrivacy)}>{t.footerPrivacy}</button>
          </p>
        </FadeUp>

        {/* close card */}
        </div>
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
          <div className="border p-7 w-[360px]" style={{ background: "rgba(12,12,12,0.9)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: 24, borderColor: "rgba(255,255,255,0.1)", boxShadow: "0 24px_60px rgba(0,0,0,0.7)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[16px] font-semibold text-[var(--color-f1)]">{t.forgotTitle}</span>
              <button
                onClick={() => setForgotOpen(false)}
                className="w-7 h-7 rounded-[10px] bg-[var(--color-bg4)] border border-[rgba(255,255,255,0.07)] flex items-center justify-center text-[var(--color-f3)] hover:bg-[var(--color-bg5)] hover:text-[var(--color-f1)] transition-all cursor-pointer"
              >
                <IconX size={14} />
              </button>
            </div>
            <p className="text-[13px] text-[var(--color-f3)] leading-[1.7] mb-5">
              {t.forgotBody}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setForgotOpen(false)}
                className="px-4 py-2 rounded-full text-[13px] text-[var(--color-f2)] border border-[rgba(255,255,255,0.13)] hover:bg-[rgba(255,255,255,0.05)] transition-all cursor-pointer"
              >
                {t.forgotClose}
              </button>
              <button
                onClick={() => { setForgotOpen(false); showToast(t.toastProfile); }}
                className="px-4 py-2 rounded-full text-[13px] font-semibold bg-[var(--color-cyan)] text-[#083344] hover:bg-[#38D9F0] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <IconSend size={13} />
                {t.forgotConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

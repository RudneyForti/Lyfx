"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logar o erro sem expor detalhes ao usuário
    console.error("[Lyfx] Erro inesperado:", error.digest ?? "sem digest");
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6">
      {/* Textura de pontos */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Brilho difuso vermelho atrás da expressão */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(248,113,113,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 text-center max-w-md flex flex-col items-center gap-6">
        {/* Logotipo */}
        <div className="font-[family-name:var(--font-display)] italic text-[22px] font-bold text-[var(--color-f1)] leading-none mb-2">
          Ly<span className="text-[var(--color-cyan)]">fx</span>
        </div>

        {/* Expressão matemática principal */}
        <div className="flex flex-col items-center gap-1">
          {/* lim f(t) com t→0 subscrito abaixo de lim */}
          <div className="flex items-end gap-3">
            {/* lim + t→0 empilhados */}
            <div className="flex flex-col items-center leading-none">
              <span
                className="text-[88px] font-bold tracking-tight leading-none"
                style={{
                  fontFamily: "var(--font-display)",
                  background: "linear-gradient(135deg, #f87171 0%, rgba(248,113,113,0.45) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                lim
              </span>
              <span
                className="text-[18px] font-medium -mt-2"
                style={{ fontFamily: "var(--font-display)", color: "#f87171cc" }}
              >
                t → 0
              </span>
            </div>

            {/* f(t) alinhado pela base */}
            <span
              className="text-[88px] font-bold tracking-tight leading-none mb-[26px]"
              style={{
                fontFamily: "var(--font-display)",
                background: "linear-gradient(135deg, #f87171 0%, rgba(248,113,113,0.45) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              f(t)
            </span>
          </div>

          {/* separador = */}
          <div
            className="text-[32px] leading-none text-[var(--color-f4)] -my-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            =
          </div>

          {/* ∅ */}
          <div
            className="text-[88px] leading-none font-bold tracking-tight text-[var(--color-f3)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ∅
          </div>
        </div>

        {/* Mensagem */}
        <div className="flex flex-col gap-2 items-center">
          <p
            className="text-[15px] font-medium text-[var(--color-f1)]"
            style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
          >
            A função não converge para nenhum estado válido.
          </p>
          <p className="text-[12px] text-[var(--color-f4)] font-mono tracking-wide">
            state(t) ∉ ℝ — erro inesperado no tempo t
          </p>
          {error.digest && (
            <p className="text-[11px] text-[var(--color-f4)] mt-1 font-mono">
              ref: {error.digest}
            </p>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={reset}
            className="h-[40px] px-6 rounded-pill bg-[var(--color-cyan)] text-[var(--color-bg)] text-[13px] font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
          >
            Tentar novamente
          </button>
          <a
            href="/dashboard"
            className="h-[40px] px-5 rounded-pill border border-[var(--color-border2)] text-[var(--color-f2)] text-[13px] font-medium flex items-center hover:border-[var(--color-cyan-border)] hover:text-[var(--color-f1)] transition-all"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

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

      <div className="relative z-10 text-center max-w-md flex flex-col items-center gap-6">
        {/* Logotipo */}
        <div className="font-[family-name:var(--font-display)] italic text-[22px] font-bold text-[var(--color-f1)] leading-none mb-2">
          Ly<span className="text-[var(--color-cyan)]">fx</span>
        </div>

        {/* Ícone de erro */}
        <div className="w-16 h-16 rounded-full bg-[var(--color-red-dim)] border border-[var(--color-red-border)] flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-red)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M12 9v4" />
            <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
            <path d="M12 16h.01" />
          </svg>
        </div>

        {/* Mensagem */}
        <div className="flex flex-col gap-2 items-center">
          <h1
            className="text-[22px] font-semibold text-[var(--color-f1)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Algo deu errado
          </h1>

          {/* Referência matemática — série divergente */}
          <p className="text-[13px] text-[var(--color-f4)] font-mono tracking-tight">
            <span title="limite da função de estado tendendo a zero é conjunto vazio">
              lim<sub>t→0</sub> f(t) = ∅
            </span>
          </p>

          <p className="text-[14px] text-[var(--color-f3)] leading-relaxed">
            Um erro inesperado ocorreu. Tente novamente ou volte para o início.
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

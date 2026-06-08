import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-6 overflow-hidden">
      {/* Textura de pontos */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Brilho difuso atrás da expressão */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(34,211,238,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-lg">
        {/* Logotipo */}
        <span className="text-[11px] tracking-[4px] uppercase text-[var(--color-f4)]">
          Ly<em className="not-italic text-[var(--color-cyan)]">fx</em>
        </span>

        {/* Expressão matemática principal */}
        <div className="flex flex-col items-center gap-1">
          {/* f(404) */}
          <div
            className="text-[88px] leading-none font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              background: "linear-gradient(135deg, #22D3EE 0%, rgba(34,211,238,0.45) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            f(404)
          </div>

          {/* separador = */}
          <div
            className="text-[32px] leading-none text-[var(--color-f4)] -my-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            =
          </div>

          {/* ∄ — símbolo "não existe" */}
          <div
            className="text-[88px] leading-none font-bold tracking-tight text-[var(--color-f3)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ∄
          </div>
        </div>

        {/* Descrição matemática */}
        <div className="flex flex-col gap-2">
          <p
            className="text-[15px] font-medium text-[var(--color-f1)]"
            style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
          >
            Esta página não pertence ao domínio da função.
          </p>
          <p className="text-[12px] text-[var(--color-f4)] font-mono tracking-wide">
            dom(f) ∩ {"{"}/rota{"}"} = ∅
          </p>
        </div>

        {/* Ações */}
        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="h-[40px] px-6 rounded-pill bg-[var(--color-cyan)] text-[var(--color-bg)] text-[13px] font-semibold flex items-center hover:opacity-90 transition-opacity"
          >
            Voltar ao Dashboard
          </Link>
          <Link
            href="/"
            className="h-[40px] px-5 rounded-pill border border-[var(--color-border2)] text-[var(--color-f2)] text-[13px] font-medium flex items-center hover:border-[var(--color-cyan-border)] hover:text-[var(--color-f1)] transition-all"
          >
            Início
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          theme?: "dark" | "light" | "auto";
          size?: "normal" | "compact";
        },
      ) => string;
    };
  }
}

interface Props {
  onToken: (token: string) => void;
  onExpire?: () => void;
}

/**
 * CS-32 — Widget do Cloudflare Turnstile.
 * Carrega o script da Cloudflare uma vez e renderiza o desafio.
 * Fallback em dev: usa a test sitekey que sempre passa (1x00000000000000000000AA).
 */
export function TurnstileWidget({ onToken, onExpire }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Chave pública — exposta no client intencionalmente
  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
    "1x00000000000000000000AA"; // test key Cloudflare (sempre passa)

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function renderWidget() {
      if (!window.turnstile || !container) return;
      window.turnstile.render(container, {
        sitekey: siteKey,
        callback: onToken,
        "expired-callback": onExpire,
        theme: "dark",
        size: "normal",
      });
    }

    if (window.turnstile) {
      renderWidget();
      return;
    }

    const SCRIPT_ID = "cf-turnstile-script";

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    } else {
      // Script já está carregando — aguarda com polling
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [siteKey, onToken, onExpire]);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-[12px] text-[var(--color-f3)] text-center leading-relaxed">
        Confirme que você é humano para continuar.
      </p>
      <div ref={containerRef} />
    </div>
  );
}

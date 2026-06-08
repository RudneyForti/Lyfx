/**
 * CS-36 — Flash cookie para erros OAuth
 *
 * Em vez de expor ?error= na URL, grava um cookie HttpOnly de vida curta.
 * O LoginForm lê e apaga o cookie na primeira renderização — URL permanece limpa.
 */

import { NextResponse } from "next/server";

export const OAUTH_ERROR_COOKIE = "oauth_error";

const MESSAGES: Record<string, string> = {
  missing_params:  "Link expirado ou inválido. Tente novamente.",
  state_mismatch:  "Link expirado ou inválido. Tente novamente.",
  failed:          "Não foi possível autenticar com o provedor. Tente novamente.",
};

export function redirectWithOAuthError(baseUrl: string, code: keyof typeof MESSAGES): NextResponse {
  const res = NextResponse.redirect(new URL("/login", baseUrl));
  res.cookies.set(OAUTH_ERROR_COOKIE, code, {
    httpOnly: false, // precisa ser lido pelo client-side
    secure:   process.env.NODE_ENV === "production",
    maxAge:   30,   // 30 segundos — lido e apagado imediatamente
    path:     "/",
    sameSite: "lax",
  });
  return res;
}

export function getOAuthErrorMessage(code: string): string {
  return MESSAGES[code] ?? MESSAGES.failed;
}

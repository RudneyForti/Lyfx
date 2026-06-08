/**
 * CS-36 — Configuração dos providers OAuth (Google + Microsoft)
 *
 * Usa a biblioteca `arctic` para lidar com o fluxo OAuth 2.0 + PKCE.
 * As redirect URIs são baseadas em APP_URL — trocar de domínio = 1 linha no .env.
 *
 * Variáveis de ambiente necessárias:
 *   APP_URL=http://localhost:3000         (ou https://seu-dominio.com em produção)
 *   GOOGLE_CLIENT_ID=...
 *   GOOGLE_CLIENT_SECRET=...
 *   MICROSOFT_CLIENT_ID=...
 *   MICROSOFT_CLIENT_SECRET=...
 */

import { Google, MicrosoftEntraId } from "arctic";

function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

// Google OAuth — escopo: profile + email
export function getGoogleProvider() {
  const clientId     = process.env.GOOGLE_CLIENT_ID     ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  const redirectUri  = `${appUrl()}/api/auth/google/callback`;
  return new Google(clientId, clientSecret, redirectUri);
}

// Microsoft — tenant "common" aceita contas pessoais e corporativas
export function getMicrosoftProvider() {
  const clientId     = process.env.MICROSOFT_CLIENT_ID     ?? "";
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET ?? "";
  const redirectUri  = `${appUrl()}/api/auth/microsoft/callback`;
  return new MicrosoftEntraId("common", clientId, clientSecret, redirectUri);
}

export type OAuthProvider = "google" | "microsoft";

export function isOAuthEnabled(provider: OAuthProvider): boolean {
  if (provider === "google") {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  }
  if (provider === "microsoft") {
    return !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
  }
  return false;
}

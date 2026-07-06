/**
 * CS-36 — OAuth provider configuration (Google + Microsoft)
 *
 * Usa a biblioteca `arctic` para lidar com o fluxo OAuth 2.0 + PKCE.
 * Redirect URIs derive from APP_URL — changing domains = 1 line in .env.
 *
 * Required environment variables:
 *   APP_URL=http://localhost:3000         (or https://your-domain.com in production)
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

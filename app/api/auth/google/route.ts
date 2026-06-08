/**
 * CS-36 — Inicia o fluxo OAuth com Google
 * GET /api/auth/google → redireciona para o consent screen do Google
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateState, generateCodeVerifier } from "arctic";
import { getGoogleProvider, isOAuthEnabled } from "@/lib/oauth";

export async function GET() {
  if (!isOAuthEnabled("google")) {
    return NextResponse.json({ error: "Google OAuth não configurado." }, { status: 503 });
  }

  const state        = generateState();
  const codeVerifier = generateCodeVerifier();
  const google       = getGoogleProvider();

  const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "profile", "email"]);

  // Persiste state e code_verifier em cookies HttpOnly (expiram em 10 min)
  const jar = await cookies();
  jar.set("oauth_state",          state,        { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  jar.set("oauth_code_verifier",  codeVerifier, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });

  return NextResponse.redirect(url);
}

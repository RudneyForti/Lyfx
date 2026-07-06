/**
 * CS-36 — Starts the OAuth flow with Microsoft
 * GET /api/auth/microsoft → redirects to Microsoft's consent screen
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateState, generateCodeVerifier } from "arctic";
import { getMicrosoftProvider, isOAuthEnabled } from "@/lib/oauth";

export async function GET() {
  if (!isOAuthEnabled("microsoft")) {
    return NextResponse.json({ error: "Microsoft OAuth não configurado." }, { status: 503 });
  }

  const state        = generateState();
  const codeVerifier = generateCodeVerifier();
  const microsoft    = getMicrosoftProvider();

  const url = microsoft.createAuthorizationURL(state, codeVerifier, ["openid", "profile", "email"]);

  const jar = await cookies();
  jar.set("oauth_ms_state",         state,        { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  jar.set("oauth_ms_code_verifier", codeVerifier, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });

  return NextResponse.redirect(url);
}

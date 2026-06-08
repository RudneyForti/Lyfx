/**
 * CS-36 — Callback do OAuth Microsoft
 * GET /api/auth/microsoft/callback?code=...&state=...
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMicrosoftProvider } from "@/lib/oauth";
import { db } from "@/lib/db";
import { setSession } from "@/lib/session";
import { logEventBg } from "@/lib/audit";
import { decodeIdToken } from "arctic";

export async function GET(request: NextRequest) {
  const jar          = await cookies();
  const storedState  = jar.get("oauth_ms_state")?.value;
  const codeVerifier = jar.get("oauth_ms_code_verifier")?.value;

  const { searchParams } = request.nextUrl;
  const code  = searchParams.get("code");
  const state = searchParams.get("state");

  jar.delete("oauth_ms_state");
  jar.delete("oauth_ms_code_verifier");

  if (!code || !state || !storedState || !codeVerifier) {
    return NextResponse.redirect(new URL("/login?error=oauth_missing_params", request.url));
  }
  if (state !== storedState) {
    return NextResponse.redirect(new URL("/login?error=oauth_state_mismatch", request.url));
  }

  try {
    const microsoft = getMicrosoftProvider();
    const tokens    = await microsoft.validateAuthorizationCode(code, codeVerifier);

    // Microsoft retorna dados no id_token (JWT)
    const claims = decodeIdToken(tokens.idToken()) as {
      oid:               string;  // unique object ID — mais estável que sub
      name?:             string;
      email?:            string;
      preferred_username?: string;
    };

    const providerUserId = claims.oid;
    const name           = claims.name ?? claims.preferred_username ?? "Usuário Microsoft";
    const email          = claims.email ?? claims.preferred_username ?? "";

    const userId = await findOrCreateOAuthUser({ provider: "microsoft", providerUserId, name, email });

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
    await setSession(userId);
    logEventBg({ action: "auth.login.success", userId, ip: ip ?? undefined, metadata: { provider: "microsoft" } });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    console.error("[OAuth Microsoft callback]", err);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }
}

async function findOrCreateOAuthUser(opts: {
  provider:       string;
  providerUserId: string;
  name:           string;
  email:          string;
}): Promise<string> {
  const { provider, providerUserId, name, email } = opts;

  const existing = await db.oAuthAccount.findUnique({
    where: { provider_providerUserId: { provider, providerUserId } },
  });
  if (existing) return existing.userId;

  if (email) {
    const byEmail = await db.user.findFirst({ where: { email: email.toLowerCase() } });
    if (byEmail) {
      await db.oAuthAccount.create({
        data: { userId: byEmail.id, provider, providerUserId },
      });
      return byEmail.id;
    }
  }

  const newUser = await db.user.create({
    data: { name, email: email ? email.toLowerCase() : null, password: "" },
  });
  await db.oAuthAccount.create({
    data: { userId: newUser.id, provider, providerUserId },
  });
  return newUser.id;
}

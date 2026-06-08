/**
 * CS-36 — Callback do OAuth Google
 * GET /api/auth/google/callback?code=...&state=...
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getGoogleProvider } from "@/lib/oauth";
import { db } from "@/lib/db";
import { setSession } from "@/lib/session";
import { logEventBg } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const jar          = await cookies();
  const storedState  = jar.get("oauth_state")?.value;
  const codeVerifier = jar.get("oauth_code_verifier")?.value;

  const { searchParams } = request.nextUrl;
  const code  = searchParams.get("code");
  const state = searchParams.get("state");

  // Limpa cookies de estado imediatamente
  jar.delete("oauth_state");
  jar.delete("oauth_code_verifier");

  // Validações de segurança
  if (!code || !state || !storedState || !codeVerifier) {
    return NextResponse.redirect(new URL("/login?error=oauth_missing_params", request.url));
  }
  if (state !== storedState) {
    return NextResponse.redirect(new URL("/login?error=oauth_state_mismatch", request.url));
  }

  try {
    const google = getGoogleProvider();
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);

    // Busca dados do usuário na Google UserInfo API
    const userInfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.accessToken()}` },
    });
    if (!userInfoRes.ok) throw new Error("Falha ao buscar dados do Google.");

    const userInfo = await userInfoRes.json() as {
      sub:   string;
      name:  string;
      email: string;
    };

    const { sub, name, email } = userInfo;

    // Busca ou cria usuário
    const userId = await findOrCreateOAuthUser({ provider: "google", providerUserId: sub, name, email });

    // Inicia sessão usando o sistema existente
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
    await setSession(userId);
    logEventBg({ action: "auth.login.success", userId, ip: ip ?? undefined, metadata: { provider: "google" } });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    console.error("[OAuth Google callback]", err);
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

  // 1. Já existe vínculo com este provider?
  const existing = await db.oAuthAccount.findUnique({
    where: { provider_providerUserId: { provider, providerUserId } },
  });
  if (existing) return existing.userId;

  // 2. Existe usuário com este e-mail? Vincula automaticamente.
  const byEmail = await db.user.findFirst({ where: { email: email.toLowerCase() } });
  if (byEmail) {
    await db.oAuthAccount.create({
      data: { userId: byEmail.id, provider, providerUserId },
    });
    return byEmail.id;
  }

  // 3. Nenhum usuário encontrado — cria conta nova (sem senha)
  const newUser = await db.user.create({
    data: { name, email: email.toLowerCase(), password: "" },
  });
  await db.oAuthAccount.create({
    data: { userId: newUser.id, provider, providerUserId },
  });
  return newUser.id;
}

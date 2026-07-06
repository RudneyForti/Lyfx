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
import { redirectWithOAuthError } from "@/lib/oauth-flash";

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

  // Security validations
  if (!code || !state || !storedState || !codeVerifier) {
    return redirectWithOAuthError(request.url, "missing_params");
  }
  if (state !== storedState) {
    return redirectWithOAuthError(request.url, "state_mismatch");
  }

  try {
    const google = getGoogleProvider();
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);

    // Fetch the user's data from the Google UserInfo API
    const userInfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.accessToken()}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!userInfoRes.ok) throw new Error("Falha ao buscar dados do Google.");

    const userInfo = await userInfoRes.json() as {
      sub:             string;
      name:            string;
      email:           string;
      email_verified?: boolean;
    };

    const { sub, name, email } = userInfo;

    // Account linking by email requires an email verified by the provider —
    // without this, a forged email would link the session to another user's account.
    if (userInfo.email_verified !== true) {
      return redirectWithOAuthError(request.url, "email_not_verified");
    }

    const userId = await findOrCreateOAuthUser({ provider: "google", providerUserId: sub, name, email });

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
    await setSession(userId);
    logEventBg({ action: "auth.login.success", userId, ip: ip ?? undefined, metadata: { provider: "google" } });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    console.error("[OAuth Google callback]", err);
    return redirectWithOAuthError(request.url, "failed");
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

  const byEmail = await db.user.findFirst({ where: { email: email.toLowerCase() } });
  if (byEmail) {
    await db.oAuthAccount.create({
      data: { userId: byEmail.id, provider, providerUserId },
    });
    return byEmail.id;
  }

  const newUser = await db.user.create({
    data: { name, email: email.toLowerCase(), password: "" },
  });
  await db.oAuthAccount.create({
    data: { userId: newUser.id, provider, providerUserId },
  });
  return newUser.id;
}

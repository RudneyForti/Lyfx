import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Valida o HMAC-SHA256 do cookie usando Web Crypto API (Edge Runtime).
 * Replica a lógica de decode() de lib/session.ts sem depender de Node.js crypto.
 */
async function isValidSession(value: string): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || !value) return false;

  const lastDot = value.lastIndexOf(".");
  if (lastDot === -1) return false;

  const userId = value.slice(0, lastDot);
  const receivedSig = value.slice(lastDot + 1);
  if (!userId || !receivedSig) return false;

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false, ["sign"]
    );
    const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(userId));
    const expectedSig = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    return receivedSig === expectedSig;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawCookie = request.cookies.get("lyfx_session")?.value;

  const publicPaths = ["/", "/login", "/studio", "/api/clear-session"];
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + "/"));

  // Validar HMAC — cookie existente mas com assinatura inválida é tratado como ausente
  const sessionValid = rawCookie ? await isValidSession(rawCookie) : false;

  if (!sessionValid && !isPublic) {
    // CS-13: preservar rota original para restaurar após login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (sessionValid && (pathname === "/" || pathname === "/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // CS-13: injeta pathname como header para preservar rota no redirect de login
  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};

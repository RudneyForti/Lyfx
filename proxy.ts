import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Valida o HMAC-SHA256 do cookie usando Web Crypto API (Edge Runtime).
 * CS-34: novo formato `{sessionId}.{userId}.{HMAC(sessionId.userId)}`
 * CUIDs não contêm pontos — split por "." sempre produz exatamente 3 partes.
 *
 * Nota: o proxy valida apenas a assinatura criptográfica (sem acesso ao DB).
 * A verificação de existência/validade da sessão no banco acontece no runtime
 * Node.js em lib/session.ts#getSession(), chamado pelo AppLayout.
 */
async function isValidSession(value: string): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || !value) return false;

  // Formato esperado: sessionId.userId.HMAC (exatamente 3 partes)
  const parts = value.split(".");
  if (parts.length !== 3) return false;

  const [sessionId, userId, receivedSig] = parts;
  if (!sessionId || !userId || !receivedSig) return false;

  // Payload assinado = "sessionId.userId"
  const payload = `${sessionId}.${userId}`;

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false, ["sign"]
    );
    const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
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
    // CS-13: preservar rota original para restaurar após login.
    // pathname vem de request.nextUrl.pathname — Next.js garante que é sempre
    // relativo (nunca "//evil.com"). A segunda linha de defesa contra open redirect
    // está em app/login/actions.ts (target.startsWith("/")).
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
  // CS-31: exclui estáticos do Next.js, assets e favicon (.ico e .svg)
  matcher: ["/((?!_next/static|_next/image|assets/|favicon\\.ico|favicon\\.svg).*)"],
};

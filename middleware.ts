import { NextRequest, NextResponse } from "next/server";

/**
 * CS-13: injeta o pathname como header para que o AppLayout possa
 * preservar a rota original no redirect para /login?redirect=<path>
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  // aplica apenas às rotas protegidas (evita overhead em API e assets)
  matcher: ["/((?!_next|api|studio|login|favicon).*)"],
};

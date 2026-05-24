import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("lyfx_session")?.value;

  const publicPaths = ["/", "/login", "/studio", "/api/clear-session"];
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + "/"));

  if (!session && !isPublic) {
    // CS-13: preservar rota original para restaurar após login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && (pathname === "/" || pathname === "/login")) {
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

import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const jar = await cookies();
  jar.delete("lyfx_session");
  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

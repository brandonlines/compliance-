import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEV_AUTH_COOKIE = "trust_console_dev_user";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login" || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(DEV_AUTH_COOKIE)?.value);

  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};

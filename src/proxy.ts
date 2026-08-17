import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

const publicPrefixes = [
  "/login",
  "/register",
  "/public",
  "/manifest",
  "/icons",
  "/offline",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname === "/" ||
    publicPrefixes.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && !session.isSuperAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!session.mandalId && !pathname.startsWith("/onboarding") && !pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sw.js|.*\\.png$|.*\\.svg$|.*\\.webmanifest$).*)"],
};

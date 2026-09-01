import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { auth } from "@/lib/auth";

const PROTECTED_ROUTES = ["/app", "/account"];
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

// Better Auth's default session cookie is `${cookiePrefix}.session_token`
// (or `${cookiePrefix}-session_token`), optionally prefixed with `__Secure-`
// when `useSecureCookies` is on (which better-auth enables by default in
// production). We don't hardcode a single literal because the exact name
// differs between local dev (plain) and the Vercel deployment (secure
// prefix). Instead we mirror `getSessionCookie`'s own resolution order to
// find whichever variant is actually present on the request, so we clear
// the exact cookie the browser is holding.
const SESSION_COOKIE_NAME_CANDIDATES = [
  "__Secure-better-auth.session_token",
  "better-auth.session_token",
  "__Secure-better-auth-session_token",
  "better-auth-session_token",
];

function resolveSessionCookieName(request: NextRequest): string | undefined {
  return SESSION_COOKIE_NAME_CANDIDATES.find((name) => request.cookies.has(name));
}

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && sessionCookie) {
    // The cookie's mere presence doesn't prove it's still valid (it may be
    // stale, e.g. after a password change) — verify server-side rather than
    // trusting a client-suppliable signal, so a visit to this URL can't be
    // used to force-clear someone else's still-valid session.
    const session = await auth.api.getSession({ headers: request.headers });
    if (session) {
      return NextResponse.redirect(new URL("/app", request.url));
    }
    const response = NextResponse.next();
    const staleCookieName = resolveSessionCookieName(request);
    if (staleCookieName) {
      response.cookies.delete(staleCookieName);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/account/:path*", "/login", "/signup", "/forgot-password", "/reset-password"],
};

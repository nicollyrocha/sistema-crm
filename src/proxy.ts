import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

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

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname, searchParams } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const sessionExpired = searchParams.get("session_expired") === "1";

  if (isProtected && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  // A `session_expired=1` marker means a Server Component just did a real
  // DB lookup and found the cookie stale (see /app and /account). Skip the
  // bounce back to /app so the stale cookie below can actually be cleared,
  // instead of looping forever between /login and /app.
  if (isAuthRoute && sessionCookie && !sessionExpired) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  const response = NextResponse.next();
  if (sessionExpired) {
    const staleCookieName = resolveSessionCookieName(request);
    if (staleCookieName) {
      response.cookies.delete(staleCookieName);
    }
  }
  return response;
}

export const config = {
  matcher: ["/app/:path*", "/account/:path*", "/login", "/signup", "/forgot-password", "/reset-password"],
};

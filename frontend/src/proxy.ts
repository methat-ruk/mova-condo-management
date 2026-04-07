import { NextRequest, NextResponse } from "next/server";

// Hardcoded to keep proxy self-contained (no module imports)
const LOCALE_COOKIE = "LOCALE";
const DEFAULT_LOCALE = "th";
const SUPPORTED_LOCALES = ["th", "en"];

const AUTH_COOKIE = "AUTH_TOKEN";
const LOGIN_PATH = "/login";
const DEFAULT_PROTECTED_REDIRECT = "/dashboard";

const PUBLIC_PATHS = [LOGIN_PATH];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const isAuthenticated = !!token;

  // Redirect authenticated users away from login
  if (isAuthenticated && isPublicPath(pathname)) {
    return NextResponse.redirect(new URL(DEFAULT_PROTECTED_REDIRECT, request.url));
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  const stored = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = stored && SUPPORTED_LOCALES.includes(stored) ? stored : DEFAULT_LOCALE;

  const response = NextResponse.next();
  response.headers.set("x-locale", locale);

  return response;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
};

import { NextRequest, NextResponse } from "next/server";

// Hardcoded to keep proxy self-contained (no module imports)
const COOKIE_NAME = "LOCALE";
const DEFAULT_LOCALE = "th";
const SUPPORTED = ["th", "en"];

export function proxy(request: NextRequest) {
  const stored = request.cookies.get(COOKIE_NAME)?.value;
  const locale = stored && SUPPORTED.includes(stored) ? stored : DEFAULT_LOCALE;

  const response = NextResponse.next();
  response.headers.set("x-locale", locale);

  return response;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
};

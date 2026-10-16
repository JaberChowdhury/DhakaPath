import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "dhakapath_admin_session";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin routes
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("error", "auth_required");
      return NextResponse.redirect(loginUrl);
    }

    // Basic structure check: token must be encodedPayload.signature
    const parts = sessionCookie.split(".");
    if (parts.length !== 2) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("error", "invalid_session");
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Decode payload to verify expiration
      const payloadJson = atob(parts[0].replace(/-/g, "+").replace(/_/g, "/"));
      const payload = JSON.parse(payloadJson);

      if (!payload.expiresAt || Date.now() > payload.expiresAt) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        loginUrl.searchParams.set("error", "session_expired");
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("error", "invalid_session");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

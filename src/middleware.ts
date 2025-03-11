import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check if it's an admin route
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Get the session token
    const session = request.cookies.get("admin_session");

    // If no session, redirect to login
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Add security headers
    const response = NextResponse.next();
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "same-origin");

    return response;
  }

  return NextResponse.next();
}

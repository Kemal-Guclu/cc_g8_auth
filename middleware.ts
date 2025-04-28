import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

import { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    interface DecodedToken {
      role: string;
      // Add other properties of the token here if needed
    }

    const decoded = verifyToken(token) as DecodedToken;
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/admin") && decoded.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
// This middleware checks if the user is authenticated and has the right role to access certain pages.
// If not, it redirects them to the login page or the home page.
// The matcher specifies which paths the middleware should apply to.
// In this case, it applies to all paths under /admin and /dashboard.

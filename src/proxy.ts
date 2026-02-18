import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveVercelToolbarEnabled } from "@/lib/features/vercel-toolbar";
import { buildContentSecurityPolicy } from "@/server/security/csp";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const toolbarEnabled = resolveVercelToolbarEnabled();

  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(toolbarEnabled),
  );
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  // App routes and API routes are dynamic and auth-sensitive.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

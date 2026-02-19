import type { NextRequest } from "next/server";
import { resolveVercelToolbarEnabled } from "@/lib/features/vercel-toolbar";
import { updateSession } from "@/lib/supabase/middleware";
import { buildContentSecurityPolicy } from "@/server/security/csp";
import {
  SECURITY_HEADERS,
  SECURITY_HEADER_VALUES,
} from "@/server/security/constants";

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  const toolbarEnabled = resolveVercelToolbarEnabled();

  response.headers.set(
    SECURITY_HEADERS.contentSecurityPolicy,
    buildContentSecurityPolicy(toolbarEnabled),
  );
  response.headers.set(
    SECURITY_HEADERS.referrerPolicy,
    SECURITY_HEADER_VALUES.referrerPolicy,
  );
  response.headers.set(
    SECURITY_HEADERS.contentTypeOptions,
    SECURITY_HEADER_VALUES.contentTypeOptions,
  );
  response.headers.set(
    SECURITY_HEADERS.frameOptions,
    SECURITY_HEADER_VALUES.frameOptions,
  );
  response.headers.set(
    SECURITY_HEADERS.permissionsPolicy,
    SECURITY_HEADER_VALUES.permissionsPolicy,
  );

  // App routes and API routes are dynamic and auth-sensitive.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set(
      SECURITY_HEADERS.cacheControl,
      SECURITY_HEADER_VALUES.noStore,
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

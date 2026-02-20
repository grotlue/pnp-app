import { requireAuth } from "@/server/auth/require-auth";
import { jsonOk } from "@/lib/api/http";
import { clearSessionCookies } from "@/server/auth/session-cookie";

const POST = async (request: Request) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  // We use a token-bound server client (`accessToken` option). In this mode,
  // supabase.auth.signOut() is not supported by supabase-js.
  // Client session cleanup is handled in the frontend and is the source of truth.
  return clearSessionCookies(jsonOk({ success: true }));
};

export { POST };

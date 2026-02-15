import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk } from "@/lib/api/http";

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { error } = await auth.context.client.auth.signOut();
  if (error) {
    return jsonError(400, "logout_failed", error.message);
  }

  return jsonOk({ success: true });
}

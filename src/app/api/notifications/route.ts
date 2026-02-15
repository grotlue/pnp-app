import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 500)
    : 100;

  const { data, error } = await auth.context.client
    .from("notifications")
    .select(
      "id, recipient_user_id, event_type, source_character_id, target_character_id, payload, is_read, created_at, read_at",
    )
    .limit(limit)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonError(400, "notifications_list_failed", error.message);
  }

  return jsonOk(data ?? []);
}

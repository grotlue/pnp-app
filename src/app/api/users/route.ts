import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk } from "@/lib/api/http";

const GET = async (request: Request) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "200");
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 1000)
    : 200;

  const { data, error } = await auth.context.client
    .from("profiles")
    .select("id, username, role")
    .limit(limit)
    .order("username", { ascending: true });

  if (error) {
    return jsonError(400, "users_list_failed", error.message);
  }

  return jsonOk(data ?? []);
};

export { GET };

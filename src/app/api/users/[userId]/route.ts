import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Params = {
  params: Promise<{ userId: string }>;
};

const GET = async (request: Request, { params }: Params) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { userId } = await params;
  const { data, error } = await auth.context.client
    .from("profiles")
    .select("id, username, description, avatar_path, locale, role")
    .eq("id", userId)
    .single();

  if (error) {
    return jsonError(404, "user_not_found", error.message);
  }

  if (data.role === "admin") {
    return jsonError(404, "user_not_found", "User profile not found");
  }

  return jsonOk({
    id: data.id,
    username: data.username,
    description: data.description,
    avatar_path: data.avatar_path,
    locale: data.locale,
  });
};

export { GET };

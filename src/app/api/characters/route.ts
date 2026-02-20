import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";

type CreateCharacterBody = {
  type?: "player" | "npc";
  name?: string;
  age?: number | null;
  description?: string;
  avatarPath?: string | null;
  campaignId?: string | null;
  isPrivate?: boolean;
};

const GET = async (request: Request) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const url = new URL(request.url);
  const scopeParam = url.searchParams.get("scope");
  const scope =
    scopeParam === "mine" || scopeParam === "public" ? scopeParam : "all";
  const limitParam = Number(url.searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 500)
    : 100;

  let query = auth.context.client
    .from("characters")
    .select(
      "id, owner_user_id, campaign_id, type, name, age, description, avatar_path, is_private, created_at, updated_at",
    )
    .limit(limit);

  if (scope === "mine") {
    query = query.eq("owner_user_id", auth.context.user.id);
  } else if (scope === "public") {
    query = query.eq("is_private", false);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) {
    return jsonError(400, "character_list_failed", error.message);
  }

  return jsonOk(data ?? []);
};

const POST = async (request: Request) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const body = await parseJsonBody<CreateCharacterBody>(request);
  if (!body?.type || !body.name) {
    return jsonError(400, "invalid_payload", "type and name are required");
  }

  const characterId = crypto.randomUUID();
  const insertPayload = {
    id: characterId,
    owner_user_id: auth.context.user.id,
    type: body.type,
    name: body.name,
    age: body.age ?? null,
    description: body.description ?? "",
    avatar_path: body.avatarPath ?? null,
    campaign_id: body.campaignId ?? null,
    is_private: body.isPrivate ?? false,
  };

  const { error } = await auth.context.client
    .from("characters")
    .insert(insertPayload);

  if (error) {
    return jsonError(400, "character_create_failed", error.message);
  }

  return jsonOk(
    {
      id: characterId,
      owner_user_id: insertPayload.owner_user_id,
      campaign_id: insertPayload.campaign_id,
      type: insertPayload.type,
      name: insertPayload.name,
      age: insertPayload.age,
      description: insertPayload.description,
      avatar_path: insertPayload.avatar_path,
      is_private: insertPayload.is_private,
    },
    201,
  );
};

export { GET, POST };

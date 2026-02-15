import { requireAuth } from "@/server/auth/require-auth";
import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";

type CreateCharacterBody = {
  type?: "player" | "npc";
  name?: string;
  age?: number | null;
  description?: string;
  avatarPath?: string | null;
  campaignId?: string | null;
};

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
    .from("characters")
    .select(
      "id, owner_user_id, campaign_id, type, name, age, description, avatar_path, created_at, updated_at",
    )
    .limit(limit)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonError(400, "character_list_failed", error.message);
  }

  return jsonOk(data ?? []);
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const body = await parseJsonBody<CreateCharacterBody>(request);
  if (!body?.type || !body.name) {
    return jsonError(400, "invalid_payload", "type and name are required");
  }

  const insertPayload = {
    owner_user_id: auth.context.user.id,
    type: body.type,
    name: body.name,
    age: body.age ?? null,
    description: body.description ?? "",
    avatar_path: body.avatarPath ?? null,
    campaign_id: body.campaignId ?? null,
  };

  const { data, error } = await auth.context.client
    .from("characters")
    .insert(insertPayload)
    .select(
      "id, owner_user_id, campaign_id, type, name, age, description, avatar_path, created_at, updated_at",
    )
    .single();

  if (error) {
    return jsonError(400, "character_create_failed", error.message);
  }

  return jsonOk(data, 201);
}

import { requireAuth } from "@/server/auth/require-auth";
import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";

type Params = {
  params: Promise<{ characterId: string }>;
};

type UpdateCharacterBody = {
  name?: string;
  type?: "player" | "npc";
  age?: number | null;
  description?: string;
  avatarPath?: string | null;
  isPrivate?: boolean;
};

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { characterId } = await params;
  const { data, error } = await auth.context.client
    .from("characters")
    .select(
      "id, owner_user_id, campaign_id, type, name, age, description, avatar_path, is_private, created_at, updated_at",
    )
    .eq("id", characterId)
    .single();

  if (error) {
    return jsonError(404, "character_not_found", error.message);
  }

  return jsonOk(data);
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { characterId } = await params;
  const body = await parseJsonBody<UpdateCharacterBody>(request);

  if (!body) {
    return jsonError(400, "invalid_payload", "invalid JSON body");
  }

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) {
    patch.name = body.name;
  }
  if (body.type !== undefined) {
    patch.type = body.type;
  }
  if (body.age !== undefined) {
    patch.age = body.age;
  }
  if (body.description !== undefined) {
    patch.description = body.description;
  }
  if (body.avatarPath !== undefined) {
    patch.avatar_path = body.avatarPath;
  }
  if (body.isPrivate !== undefined) {
    patch.is_private = body.isPrivate;
  }

  const { data, error } = await auth.context.client
    .from("characters")
    .update(patch)
    .eq("id", characterId)
    .select(
      "id, owner_user_id, campaign_id, type, name, age, description, avatar_path, is_private, created_at, updated_at",
    )
    .single();

  if (error) {
    return jsonError(400, "character_update_failed", error.message);
  }

  return jsonOk(data);
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { characterId } = await params;
  const { error } = await auth.context.client
    .from("characters")
    .delete()
    .eq("id", characterId);

  if (error) {
    return jsonError(400, "character_delete_failed", error.message);
  }

  return jsonOk({ deleted: true });
}

import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import { requireAdmin } from "@/server/auth/require-admin";
import { createServiceRoleSupabaseClient } from "@/server/supabase/service-role-client";

type Params = {
  params: Promise<{
    characterId: string;
  }>;
};

type UpdateCharacterBody = {
  ownerUserId?: string;
  campaignId?: string | null;
  type?: "player" | "npc";
  name?: string;
  age?: number | null;
  description?: string;
  avatarPath?: string | null;
};

export async function PATCH(request: Request, { params }: Params) {
  const admin = await requireAdmin(request);
  if ("response" in admin) {
    return admin.response;
  }

  const { characterId } = await params;
  const body = await parseJsonBody<UpdateCharacterBody>(request);
  if (!body) {
    return jsonError(400, "invalid_payload", "invalid JSON body");
  }

  const patch: Record<string, unknown> = {};
  if (body.ownerUserId !== undefined) {
    patch.owner_user_id = body.ownerUserId;
  }
  if (body.campaignId !== undefined) {
    patch.campaign_id = body.campaignId;
  }
  if (body.type !== undefined) {
    patch.type = body.type;
  }
  if (body.name !== undefined) {
    patch.name = body.name;
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

  const service = createServiceRoleSupabaseClient();
  const { data, error } = await service
    .from("characters")
    .update(patch)
    .eq("id", characterId)
    .select(
      "id, owner_user_id, campaign_id, type, name, age, description, avatar_path, created_at, updated_at",
    )
    .single();

  if (error) {
    return jsonError(400, "admin_character_update_failed", error.message);
  }

  return jsonOk(data);
}

export async function DELETE(request: Request, { params }: Params) {
  const admin = await requireAdmin(request);
  if ("response" in admin) {
    return admin.response;
  }

  const { characterId } = await params;
  const service = createServiceRoleSupabaseClient();
  const { error } = await service.from("characters").delete().eq("id", characterId);

  if (error) {
    return jsonError(400, "admin_character_delete_failed", error.message);
  }

  return jsonOk({ deleted: true });
}

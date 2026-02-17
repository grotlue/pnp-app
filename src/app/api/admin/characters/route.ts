import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import { requireAdmin } from "@/server/auth/require-admin";
import { createServiceRoleSupabaseClient } from "@/server/supabase/service-role-client";

type CreateCharacterBody = {
  ownerUserId?: string;
  campaignId?: string | null;
  type?: "player" | "npc";
  name?: string;
  age?: number | null;
  description?: string;
  avatarPath?: string | null;
  isPrivate?: boolean;
};

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if ("response" in admin) {
    return admin.response;
  }

  const client = (() => {
    try {
      return createServiceRoleSupabaseClient();
    } catch {
      return admin.context.client;
    }
  })();
  const { data, error } = await client
    .from("characters")
    .select(
      "id, owner_user_id, campaign_id, type, name, age, description, avatar_path, is_private, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return jsonError(400, "admin_character_list_failed", error.message);
  }

  return jsonOk(data ?? []);
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if ("response" in admin) {
    return admin.response;
  }

  const body = await parseJsonBody<CreateCharacterBody>(request);
  if (!body?.ownerUserId || !body.type || !body.name) {
    return jsonError(
      400,
      "invalid_payload",
      "ownerUserId, type, and name are required",
    );
  }

  const client = (() => {
    try {
      return createServiceRoleSupabaseClient();
    } catch {
      return admin.context.client;
    }
  })();
  const { data, error } = await client
    .from("characters")
    .insert({
      owner_user_id: body.ownerUserId,
      campaign_id: body.campaignId ?? null,
      type: body.type,
      name: body.name,
      age: body.age ?? null,
      description: body.description ?? "",
      avatar_path: body.avatarPath ?? null,
      is_private: body.isPrivate ?? false,
    })
    .select(
      "id, owner_user_id, campaign_id, type, name, age, description, avatar_path, is_private, created_at, updated_at",
    )
    .single();

  if (error) {
    return jsonError(400, "admin_character_create_failed", error.message);
  }

  return jsonOk(data, 201);
}

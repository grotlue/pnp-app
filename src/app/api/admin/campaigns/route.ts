import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import { requireAdmin } from "@/server/auth/require-admin";
import { createServiceRoleSupabaseClient } from "@/server/supabase/service-role-client";

type CreateCampaignBody = {
  ownerUserId?: string;
  title?: string;
  description?: string;
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
    .from("campaigns")
    .select("id, owner_user_id, title, description, is_private, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return jsonError(400, "admin_campaign_list_failed", error.message);
  }

  return jsonOk(data ?? []);
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if ("response" in admin) {
    return admin.response;
  }

  const body = await parseJsonBody<CreateCampaignBody>(request);
  if (!body?.ownerUserId || !body.title) {
    return jsonError(400, "invalid_payload", "ownerUserId and title are required");
  }

  const client = (() => {
    try {
      return createServiceRoleSupabaseClient();
    } catch {
      return admin.context.client;
    }
  })();
  const { data, error } = await client
    .from("campaigns")
    .insert({
      owner_user_id: body.ownerUserId,
      title: body.title,
      description: body.description ?? "",
      is_private: body.isPrivate ?? false,
    })
    .select("id, owner_user_id, title, description, is_private, created_at, updated_at")
    .single();

  if (error) {
    return jsonError(400, "admin_campaign_create_failed", error.message);
  }

  return jsonOk(data, 201);
}

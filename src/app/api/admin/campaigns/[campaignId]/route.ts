import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import { requireAdmin } from "@/server/auth/require-admin";
import { createServiceRoleSupabaseClient } from "@/server/supabase/service-role-client";

type Params = {
  params: Promise<{
    campaignId: string;
  }>;
};

type UpdateCampaignBody = {
  ownerUserId?: string;
  title?: string;
  description?: string;
  isPrivate?: boolean;
};

export async function PATCH(request: Request, { params }: Params) {
  const admin = await requireAdmin(request);
  if ("response" in admin) {
    return admin.response;
  }

  const { campaignId } = await params;
  const body = await parseJsonBody<UpdateCampaignBody>(request);
  if (!body) {
    return jsonError(400, "invalid_payload", "invalid JSON body");
  }

  const patch: Record<string, unknown> = {};
  if (body.ownerUserId !== undefined) {
    patch.owner_user_id = body.ownerUserId;
  }
  if (body.title !== undefined) {
    patch.title = body.title;
  }
  if (body.description !== undefined) {
    patch.description = body.description;
  }
  if (body.isPrivate !== undefined) {
    patch.is_private = body.isPrivate;
  }

  const service = createServiceRoleSupabaseClient();
  const { data, error } = await service
    .from("campaigns")
    .update(patch)
    .eq("id", campaignId)
    .select("id, owner_user_id, title, description, is_private, created_at, updated_at")
    .single();

  if (error) {
    return jsonError(400, "admin_campaign_update_failed", error.message);
  }

  return jsonOk(data);
}

export async function DELETE(request: Request, { params }: Params) {
  const admin = await requireAdmin(request);
  if ("response" in admin) {
    return admin.response;
  }

  const { campaignId } = await params;
  const service = createServiceRoleSupabaseClient();
  const { error } = await service.from("campaigns").delete().eq("id", campaignId);

  if (error) {
    return jsonError(400, "admin_campaign_delete_failed", error.message);
  }

  return jsonOk({ deleted: true });
}

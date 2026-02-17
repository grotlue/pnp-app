import { requireAuth } from "@/server/auth/require-auth";
import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";

type Params = {
  params: Promise<{ campaignId: string }>;
};

type UpdateCampaignBody = {
  title?: string;
  description?: string;
  isPrivate?: boolean;
};

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { campaignId } = await params;
  const { client } = auth.context;

  const [
    { data: campaign, error: campaignError },
    { data: memberships, error: membershipError },
  ] = await Promise.all([
    client
      .from("campaigns")
      .select(
        "id, owner_user_id, title, description, is_private, created_at, updated_at",
      )
      .eq("id", campaignId)
      .single(),
    client
      .from("campaign_memberships")
      .select(
        "id, user_id, state, source, created_at, updated_at, responded_at",
      )
      .eq("campaign_id", campaignId),
  ]);

  if (campaignError) {
    return jsonError(404, "campaign_not_found", campaignError.message);
  }

  if (membershipError) {
    return jsonError(
      400,
      "campaign_memberships_fetch_failed",
      membershipError.message,
    );
  }

  return jsonOk({ campaign, memberships: memberships ?? [] });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { campaignId } = await params;
  const body = await parseJsonBody<UpdateCampaignBody>(request);
  if (!body) {
    return jsonError(400, "invalid_payload", "invalid JSON body");
  }

  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) {
    patch.title = body.title;
  }
  if (body.description !== undefined) {
    patch.description = body.description;
  }
  if (body.isPrivate !== undefined) {
    patch.is_private = body.isPrivate;
  }

  const { data, error } = await auth.context.client
    .from("campaigns")
    .update(patch)
    .eq("id", campaignId)
    .select(
      "id, owner_user_id, title, description, is_private, created_at, updated_at",
    )
    .single();

  if (error) {
    return jsonError(400, "campaign_update_failed", error.message);
  }

  return jsonOk(data);
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { campaignId } = await params;
  const { error } = await auth.context.client
    .from("campaigns")
    .delete()
    .eq("id", campaignId);

  if (error) {
    return jsonError(400, "campaign_delete_failed", error.message);
  }

  return jsonOk({ deleted: true });
}

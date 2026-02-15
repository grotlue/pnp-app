import { requireAuth } from "@/server/auth/require-auth";
import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";

type CreateCampaignBody = {
  title?: string;
  description?: string;
  isPrivate?: boolean;
};

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { client, user } = auth.context;
  const url = new URL(request.url);
  const roleForUserId = url.searchParams.get("roleForUserId");
  const limitParam = Number(url.searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 500)
    : 100;

  const { data, error } = await client
    .from("campaigns")
    .select("id, owner_user_id, title, description, is_private, created_at, updated_at")
    .limit(limit)
    .order("updated_at", { ascending: false });

  if (error) {
    return jsonError(400, "campaign_list_failed", error.message);
  }

  const campaigns = data ?? [];
  if (campaigns.length === 0) {
    return jsonOk([]);
  }

  const campaignIds = campaigns.map((campaign) => campaign.id);
  const ownerIds = [...new Set(campaigns.map((campaign) => campaign.owner_user_id))];

  const [
    { data: memberships, error: membershipError },
    { data: owners, error: ownersError },
    { data: membershipsForTargetUser, error: membershipsForTargetUserError },
  ] =
    await Promise.all([
      client
        .from("campaign_memberships")
        .select("campaign_id, user_id, state")
        .in("campaign_id", campaignIds)
        .eq("state", "accepted"),
      client.from("profiles").select("id, username, role").in("id", ownerIds),
      roleForUserId
        ? client
            .from("campaign_memberships")
            .select("campaign_id")
            .in("campaign_id", campaignIds)
            .eq("state", "accepted")
            .eq("user_id", roleForUserId)
        : Promise.resolve({ data: null, error: null }),
    ]);

  if (membershipError) {
    return jsonError(400, "campaign_list_failed", membershipError.message);
  }
  if (ownersError) {
    return jsonError(400, "campaign_list_failed", ownersError.message);
  }
  if (membershipsForTargetUserError) {
    return jsonError(400, "campaign_list_failed", membershipsForTargetUserError.message);
  }

  const ownerMap = new Map(
    (owners ?? []).map((entry) => [entry.id, { username: entry.username, role: entry.role }]),
  );
  const acceptedMembersByCampaign = new Map<string, string[]>();
  for (const membership of memberships ?? []) {
    const campaignMemberIds = acceptedMembersByCampaign.get(membership.campaign_id) ?? [];
    campaignMemberIds.push(membership.user_id);
    acceptedMembersByCampaign.set(membership.campaign_id, campaignMemberIds);
  }
  const acceptedTargetCampaignIds = new Set(
    (membershipsForTargetUser ?? []).map((membership) => membership.campaign_id),
  );

  return jsonOk(
    campaigns.map((campaign) => {
      const acceptedMemberIds = acceptedMembersByCampaign.get(campaign.id) ?? [];
      const isOwner = campaign.owner_user_id === user.id;
      const isAcceptedPlayer =
        !isOwner && acceptedMemberIds.some((memberUserId) => memberUserId === user.id);
      const owner = ownerMap.get(campaign.owner_user_id);
      const roleForTargetUser = roleForUserId
        ? campaign.owner_user_id === roleForUserId
          ? "owner"
          : acceptedTargetCampaignIds.has(campaign.id)
            ? "player"
            : null
        : null;

      return {
        ...campaign,
        owner_username: owner?.username ?? null,
        owner_role: owner?.role ?? null,
        player_count: acceptedMemberIds.filter((memberUserId) => memberUserId !== campaign.owner_user_id)
          .length,
        current_user_role: isOwner ? "owner" : isAcceptedPlayer ? "player" : null,
        role_for_user: roleForTargetUser,
      };
    }),
  );
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const body = await parseJsonBody<CreateCampaignBody>(request);
  if (!body?.title) {
    return jsonError(400, "invalid_payload", "title is required");
  }

  const { data, error } = await auth.context.client.rpc(
    "rpc_create_campaign_with_owner_membership",
    {
      p_title: body.title,
      p_description: body.description ?? "",
    },
  );

  if (error) {
    return jsonError(400, "campaign_create_failed", error.message);
  }

  if (body.isPrivate !== undefined && body.isPrivate) {
    const { error: updateError } = await auth.context.client
      .from("campaigns")
      .update({ is_private: true })
      .eq("id", data);

    if (updateError) {
      return jsonError(400, "campaign_create_failed", updateError.message);
    }
  }

  return jsonOk({ campaignId: data }, 201);
}

import { requireAuth } from "@/server/auth/require-auth";
import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";
import { listCampaignsRpcQuery } from "@/features/campaigns/queries/list-campaigns-rpc.query";
import { mapCampaignRpcRow } from "@/features/campaigns/logic/map-campaign-rpc-row.logic";
import { parseCampaignListScopeParam } from "@/server/api/validation/campaign-scope";
import { parseListLimitParam } from "@/server/api/validation/list-query";

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

  const { client } = auth.context;
  const url = new URL(request.url);
  const roleForUserId = url.searchParams.get("roleForUserId");
  const scope = parseCampaignListScopeParam(url.searchParams.get("scope"));
  const limit = parseListLimitParam(url.searchParams.get("limit"), 100, 1, 500);

  try {
    const rows = await listCampaignsRpcQuery(client, {
      scope,
      roleForUserId,
      limit,
    });

    return jsonOk(rows.map(mapCampaignRpcRow));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(400, "campaign_list_failed", message);
  }
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

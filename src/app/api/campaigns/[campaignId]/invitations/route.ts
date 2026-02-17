import { requireAuth } from "@/server/auth/require-auth";
import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";

type Params = {
  params: Promise<{ campaignId: string }>;
};

type InviteBody = {
  userId?: string;
};

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { campaignId } = await params;
  const body = await parseJsonBody<InviteBody>(request);

  if (!body?.userId) {
    return jsonError(400, "invalid_payload", "userId is required");
  }

  const { data, error } = await auth.context.client.rpc(
    "rpc_invite_user_to_campaign",
    {
      p_campaign_id: campaignId,
      p_user_id: body.userId,
    },
  );

  if (error) {
    return jsonError(400, "campaign_invite_failed", error.message);
  }

  return jsonOk({ membershipId: data }, 201);
}

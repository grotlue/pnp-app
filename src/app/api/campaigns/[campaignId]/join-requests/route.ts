import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Params = {
  params: Promise<{ campaignId: string }>;
};

const POST = async (request: Request, { params }: Params) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { campaignId } = await params;
  const { data, error } = await auth.context.client.rpc(
    "rpc_request_join_campaign",
    {
      p_campaign_id: campaignId,
    },
  );

  if (error) {
    return jsonError(400, "campaign_join_request_failed", error.message);
  }

  return jsonOk({ membershipId: data }, 201);
};

export { POST };

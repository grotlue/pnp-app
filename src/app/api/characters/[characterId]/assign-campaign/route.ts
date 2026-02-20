import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";

type Params = {
  params: Promise<{ characterId: string }>;
};

type AssignBody = {
  campaignId?: string;
};

const POST = async (request: Request, { params }: Params) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { characterId } = await params;
  const body = await parseJsonBody<AssignBody>(request);

  if (!body?.campaignId) {
    return jsonError(400, "invalid_payload", "campaignId is required");
  }

  const { error } = await auth.context.client.rpc(
    "rpc_assign_character_to_campaign",
    {
      p_character_id: characterId,
      p_campaign_id: body.campaignId,
    },
  );

  if (error) {
    return jsonError(400, "character_assign_campaign_failed", error.message);
  }

  return jsonOk({ assigned: true });
};

export { POST };

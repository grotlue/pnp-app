import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";

type Params = {
  params: Promise<{
    campaignId: string;
    membershipId: string;
  }>;
};

type DecisionBody = {
  state?: "accepted" | "rejected";
};

const POST = async (request: Request, { params }: Params) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { membershipId } = await params;
  const body = await parseJsonBody<DecisionBody>(request);

  if (!body?.state || !["accepted", "rejected"].includes(body.state)) {
    return jsonError(
      400,
      "invalid_payload",
      "state must be accepted or rejected",
    );
  }

  const { error } = await auth.context.client.rpc(
    "rpc_decide_campaign_membership",
    {
      p_membership_id: membershipId,
      p_state: body.state,
    },
  );

  if (error) {
    return jsonError(400, "campaign_membership_decision_failed", error.message);
  }

  return jsonOk({ decided: true });
};

export { POST };

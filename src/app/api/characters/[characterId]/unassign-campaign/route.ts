import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Params = {
  params: Promise<{ characterId: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { characterId } = await params;

  const { error } = await auth.context.client.rpc("rpc_unassign_character_from_campaign", {
    p_character_id: characterId,
  });

  if (error) {
    return jsonError(400, "character_unassign_campaign_failed", error.message);
  }

  return jsonOk({ unassigned: true });
}

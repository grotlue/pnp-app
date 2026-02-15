import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Params = {
  params: Promise<{
    characterId: string;
    otherCharacterId: string;
  }>;
};

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { characterId, otherCharacterId } = await params;
  const { data, error } = await auth.context.client.rpc(
    "rpc_get_character_relation_detail",
    {
      p_character_id: characterId,
      p_other_character_id: otherCharacterId,
    },
  );

  if (error) {
    return jsonError(400, "character_relation_detail_failed", error.message);
  }

  return jsonOk(data);
}

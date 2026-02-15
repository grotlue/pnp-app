import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Params = {
  params: Promise<{ characterId: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { characterId } = await params;

  const { data, error } = await auth.context.client.rpc(
    "rpc_get_character_relations_summary",
    {
      p_character_id: characterId,
    },
  );

  if (error) {
    return jsonError(400, "character_relations_summary_failed", error.message);
  }

  return jsonOk(data ?? []);
}

import { requireAuth } from "@/server/auth/require-auth";
import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";

type CreateCampaignBody = {
  title?: string;
  description?: string;
};

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { client } = auth.context;
  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "100");
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 500)
    : 100;
  const { data, error } = await client
    .from("campaigns")
    .select("id, owner_user_id, title, description, created_at, updated_at")
    .limit(limit)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonError(400, "campaign_list_failed", error.message);
  }

  return jsonOk(data ?? []);
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

  return jsonOk({ campaignId: data }, 201);
}

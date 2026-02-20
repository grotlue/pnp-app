import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";

type Params = {
  params: Promise<{ relationshipId: string }>;
};

type CreateTimelineEntryBody = {
  occurredAt?: string;
  content?: string;
};

const GET = async (request: Request, { params }: Params) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { relationshipId } = await params;
  const { data, error } = await auth.context.client
    .from("relationship_timeline_entries")
    .select(
      "id, relationship_id, owner_user_id, occurred_at, content, created_at",
    )
    .eq("relationship_id", relationshipId)
    .order("occurred_at", { ascending: false });

  if (error) {
    return jsonError(400, "relationship_timeline_fetch_failed", error.message);
  }

  return jsonOk(data ?? []);
};

const POST = async (request: Request, { params }: Params) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { relationshipId } = await params;
  const body = await parseJsonBody<CreateTimelineEntryBody>(request);

  if (!body?.content) {
    return jsonError(400, "invalid_payload", "content is required");
  }

  const { data, error } = await auth.context.client.rpc(
    "rpc_add_relationship_timeline_entry",
    {
      p_relationship_id: relationshipId,
      p_occurred_at: body.occurredAt ?? null,
      p_content: body.content,
    },
  );

  if (error) {
    return jsonError(400, "relationship_timeline_create_failed", error.message);
  }

  return jsonOk({ timelineEntryId: data }, 201);
};

export { GET, POST };

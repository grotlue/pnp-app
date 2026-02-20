import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";

type Params = {
  params: Promise<{ relationshipId: string }>;
};

type UpdateRelationshipBody = {
  targetCharacterId?: string | null;
  targetSnapshotName?: string | null;
  categoryId?: number;
  labelPresetId?: number | null;
  labelCustom?: string | null;
  description?: string;
};

const GET = async (request: Request, { params }: Params) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { relationshipId } = await params;
  const { data, error } = await auth.context.client
    .from("character_relationships")
    .select("*")
    .eq("id", relationshipId)
    .single();

  if (error) {
    return jsonError(404, "relationship_not_found", error.message);
  }

  return jsonOk(data);
};

const PATCH = async (request: Request, { params }: Params) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { relationshipId } = await params;
  const body = await parseJsonBody<UpdateRelationshipBody>(request);

  if (!body || body.categoryId === undefined) {
    return jsonError(400, "invalid_payload", "categoryId is required");
  }

  const hasTargetCharacter = Boolean(body.targetCharacterId);
  const hasSnapshot = Boolean(body.targetSnapshotName?.trim());
  if (
    (hasTargetCharacter && hasSnapshot) ||
    (!hasTargetCharacter && !hasSnapshot)
  ) {
    return jsonError(
      400,
      "invalid_payload",
      "Provide either targetCharacterId or targetSnapshotName",
    );
  }

  const { error } = await auth.context.client.rpc("rpc_update_relationship", {
    p_relationship_id: relationshipId,
    p_target_character_id: body.targetCharacterId ?? null,
    p_target_snapshot_name: body.targetSnapshotName ?? null,
    p_category_id: body.categoryId,
    p_label_preset_id: body.labelPresetId ?? null,
    p_label_custom: body.labelCustom ?? null,
    p_description: body.description ?? "",
  });

  if (error) {
    return jsonError(400, "relationship_update_failed", error.message);
  }

  return jsonOk({ updated: true });
};

const DELETE = async (request: Request, { params }: Params) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { relationshipId } = await params;

  const { error } = await auth.context.client
    .from("character_relationships")
    .delete()
    .eq("id", relationshipId);

  if (error) {
    return jsonError(400, "relationship_delete_failed", error.message);
  }

  return jsonOk({ deleted: true });
};

export { DELETE, GET, PATCH };

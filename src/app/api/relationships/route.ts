import { requireAuth } from "@/server/auth/require-auth";
import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";

type CreateRelationshipBody = {
  sourceCharacterId?: string;
  targetCharacterId?: string | null;
  targetSnapshotName?: string | null;
  categoryId?: number;
  labelPresetId?: number | null;
  labelCustom?: string | null;
  description?: string;
};

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const body = await parseJsonBody<CreateRelationshipBody>(request);
  if (
    !body?.sourceCharacterId ||
    body.categoryId === undefined
  ) {
    return jsonError(
      400,
      "invalid_payload",
      "sourceCharacterId and categoryId are required",
    );
  }

  const hasTargetCharacter = Boolean(body.targetCharacterId);
  const hasSnapshot = Boolean(body.targetSnapshotName?.trim());
  if ((hasTargetCharacter && hasSnapshot) || (!hasTargetCharacter && !hasSnapshot)) {
    return jsonError(
      400,
      "invalid_payload",
      "Provide either targetCharacterId or targetSnapshotName",
    );
  }

  const { data, error } = await auth.context.client.rpc("rpc_create_relationship", {
    p_source_character_id: body.sourceCharacterId,
    p_target_character_id: body.targetCharacterId ?? null,
    p_target_snapshot_name: body.targetSnapshotName ?? null,
    p_category_id: body.categoryId,
    p_label_preset_id: body.labelPresetId ?? null,
    p_label_custom: body.labelCustom ?? null,
    p_description: body.description ?? "",
  });

  if (error) {
    return jsonError(400, "relationship_create_failed", error.message);
  }

  return jsonOk({ relationshipId: data }, 201);
}

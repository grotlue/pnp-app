import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Params = {
  params: Promise<{ characterId: string }>;
};

type RelationshipRow = {
  id: string;
  source_character_id: string;
  target_character_id: string | null;
  owner_user_id: string;
  category_id: number;
  label_preset_id: number | null;
  label_custom: string | null;
  description: string;
  target_snapshot_name: string | null;
  created_at: string;
  updated_at: string;
};

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { characterId } = await params;

  const { data, error } = await auth.context.client
    .from("character_relationships")
    .select(
      "id, source_character_id, target_character_id, owner_user_id, category_id, label_preset_id, label_custom, description, target_snapshot_name, created_at, updated_at",
    )
    .eq("source_character_id", characterId)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonError(
      400,
      "character_outgoing_relationships_failed",
      error.message,
    );
  }

  const rows = (data ?? []) as RelationshipRow[];
  const targetIds = rows
    .map((row) => row.target_character_id)
    .filter((value): value is string => Boolean(value));

  const nameById = new Map<string, string>();
  if (targetIds.length > 0) {
    const { data: targets, error: targetsError } = await auth.context.client
      .from("characters")
      .select("id, name")
      .in("id", targetIds);

    if (targetsError) {
      return jsonError(
        400,
        "character_targets_fetch_failed",
        targetsError.message,
      );
    }

    for (const target of targets ?? []) {
      nameById.set(target.id as string, target.name as string);
    }
  }

  return jsonOk(
    rows.map((row) => ({
      ...row,
      target_name:
        (row.target_character_id
          ? nameById.get(row.target_character_id)
          : null) ??
        row.target_snapshot_name ??
        null,
      is_external_target: row.target_character_id === null,
    })),
  );
}

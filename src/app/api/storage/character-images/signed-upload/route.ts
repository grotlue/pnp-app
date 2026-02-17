import { randomUUID } from "crypto";
import { canManageCharacter } from "@/features/users/logic/role.logic";
import { requireAuth } from "@/server/auth/require-auth";
import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";
import { isWithinImageUploadSizeLimit } from "@/lib/storage/image-upload";
import { isSquare, sanitizeFileName } from "@/lib/storage/files";
import { getUserRole } from "@/server/auth/get-user-role";
import { enforceRateLimit } from "@/server/rate-limit/enforce-rate-limit";

type Body = {
  characterId?: string;
  fileName?: string;
  width?: number;
  height?: number;
  fileSize?: number;
};

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const rateLimited = await enforceRateLimit({
    request,
    route: "storage:character-images:signed-upload",
    limit: 20,
    windowMs: 15 * 60_000,
    userId: auth.context.user.id,
  });
  if (rateLimited) {
    return rateLimited;
  }

  const body = await parseJsonBody<Body>(request);
  if (
    !body?.characterId ||
    !body.fileName ||
    !isSquare(body.width, body.height) ||
    !isWithinImageUploadSizeLimit(body.fileSize)
  ) {
    return jsonError(
      400,
      "invalid_payload",
      "characterId, fileName, square dimensions, and bounded fileSize are required",
    );
  }

  const { data: character, error: characterError } = await auth.context.client
    .from("characters")
    .select("owner_user_id, is_private")
    .eq("id", body.characterId)
    .maybeSingle();

  if (characterError) {
    return jsonError(400, "character_lookup_failed", characterError.message);
  }

  if (!character) {
    return jsonError(404, "character_not_found", "Character not found");
  }

  const roleResult = await getUserRole(auth.context);
  if (roleResult.errorMessage) {
    return jsonError(400, "role_lookup_failed", roleResult.errorMessage);
  }

  const canManage = canManageCharacter({
    isOwner: character.owner_user_id === auth.context.user.id,
    role: roleResult.role,
    isPrivate: character.is_private,
  });
  if (!canManage) {
    return jsonError(
      403,
      "forbidden",
      "Cannot upload image for this character",
    );
  }

  const path = `${auth.context.user.id}/${body.characterId}/${randomUUID()}-${sanitizeFileName(body.fileName)}`;
  const { data, error } = await auth.context.authClient.storage
    .from("character-images")
    .createSignedUploadUrl(path);

  if (error) {
    return jsonError(
      400,
      "character_image_signed_upload_failed",
      error.message,
    );
  }

  return jsonOk({ ...data, path });
}

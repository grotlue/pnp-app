import { randomUUID } from "crypto";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";
import { isSquare, sanitizeFileName } from "@/lib/storage/files";
import { isWithinImageUploadSizeLimit } from "@/lib/storage/image-upload";
import { requireAuth } from "@/server/auth/require-auth";
import { enforceRateLimit } from "@/server/rate-limit/enforce-rate-limit";

type Body = {
  fileName?: string;
  width?: number;
  height?: number;
  fileSize?: number;
};

const POST = async (request: Request) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const rateLimited = await enforceRateLimit({
    request,
    route: "storage:profile-images:signed-upload",
    limit: 20,
    windowMs: 15 * 60_000,
    userId: auth.context.user.id,
  });
  if (rateLimited) {
    return rateLimited;
  }

  const body = await parseJsonBody<Body>(request);
  if (
    !body?.fileName ||
    !isSquare(body.width, body.height) ||
    !isWithinImageUploadSizeLimit(body.fileSize)
  ) {
    return jsonError(
      400,
      "invalid_payload",
      "fileName is required, image must be square, and fileSize must be within limits",
    );
  }

  const path = `${auth.context.user.id}/${randomUUID()}-${sanitizeFileName(body.fileName)}`;
  const { data, error } = await auth.context.authClient.storage
    .from("profile-images")
    .createSignedUploadUrl(path);

  if (error) {
    return jsonError(400, "profile_image_signed_upload_failed", error.message);
  }

  return jsonOk({ ...data, path });
};

export { POST };

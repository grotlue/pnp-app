import { randomUUID } from "crypto";
import { requireAuth } from "@/server/auth/require-auth";
import { parseJsonBody, jsonError, jsonOk } from "@/lib/api/http";
import { isSquare, sanitizeFileName } from "@/lib/storage/files";

type Body = {
  fileName?: string;
  width?: number;
  height?: number;
};

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const body = await parseJsonBody<Body>(request);
  if (!body?.fileName || !isSquare(body.width, body.height)) {
    return jsonError(
      400,
      "invalid_payload",
      "fileName is required and image dimensions must be square",
    );
  }

  const path = `${auth.context.user.id}/${randomUUID()}-${sanitizeFileName(body.fileName)}`;
  const { data, error } = await auth.context.client.storage
    .from("profile-images")
    .createSignedUploadUrl(path);

  if (error) {
    return jsonError(400, "profile_image_signed_upload_failed", error.message);
  }

  return jsonOk({ ...data, path });
}

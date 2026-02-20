import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api/http";

type Body = {
  path?: string;
  expiresIn?: number;
};

const POST = async (request: Request) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const body = await parseJsonBody<Body>(request);
  if (!body?.path) {
    return jsonError(400, "invalid_payload", "path is required");
  }

  const { data, error } = await auth.context.authClient.storage
    .from("profile-images")
    .createSignedUrl(body.path, body.expiresIn ?? 60 * 10);

  if (error) {
    return jsonError(400, "profile_image_signed_url_failed", error.message);
  }

  return jsonOk(data);
};

export { POST };

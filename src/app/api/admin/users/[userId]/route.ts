import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Params = {
  params: Promise<{
    userId: string;
  }>;
};

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { userId } = await params;
  const { error } = await auth.context.client.rpc("rpc_admin_delete_user", {
    p_user_id: userId,
  });

  if (error) {
    return jsonError(403, "admin_delete_failed", error.message);
  }

  return jsonOk({ deleted: true });
}

import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk } from "@/lib/api/http";

type Params = {
  params: Promise<{ notificationId: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { notificationId } = await params;
  const { error } = await auth.context.client.rpc("rpc_mark_notification_read", {
    p_notification_id: notificationId,
  });

  if (error) {
    return jsonError(400, "notification_mark_read_failed", error.message);
  }

  return jsonOk({ read: true });
}

import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { listNotificationsRpcQuery } from "@/features/notifications/queries/list-notifications-rpc.query";
import { mapNotificationRpcRow } from "@/features/notifications/logic/map-notification-rpc-row.logic";
import { parseListLimitParam } from "@/server/api/validation/list-query";

const GET = async (request: Request) => {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const url = new URL(request.url);
  const limit = parseListLimitParam(url.searchParams.get("limit"), 100, 1, 500);

  try {
    const rows = await listNotificationsRpcQuery(auth.context.client, {
      limit,
    });
    return jsonOk(rows.map(mapNotificationRpcRow));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonError(400, "notifications_list_failed", message);
  }
};

export { GET };

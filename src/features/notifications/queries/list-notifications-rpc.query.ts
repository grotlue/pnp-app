import type { NotificationRpcRow } from "@/features/notifications/types";

type NotificationRpcClient = {
  rpc: (
    fn: "rpc_list_notifications_for_user",
    args: {
      p_limit: number;
      p_only_unread: boolean;
    },
  ) => PromiseLike<{
    data: NotificationRpcRow[] | null;
    error: { message: string } | null;
  }>;
};

type ListNotificationsRpcQueryParams = {
  limit: number;
  onlyUnread?: boolean;
};

export async function listNotificationsRpcQuery(
  client: NotificationRpcClient,
  params: ListNotificationsRpcQueryParams,
): Promise<NotificationRpcRow[]> {
  const { data, error } = await client.rpc("rpc_list_notifications_for_user", {
    p_limit: params.limit,
    p_only_unread: Boolean(params.onlyUnread),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

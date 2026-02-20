type NotificationCountRpcClient = {
  rpc: (fn: "rpc_count_unread_notifications_for_user") => PromiseLike<{
    data: number | string | null;
    error: { message: string } | null;
  }>;
};

const countUnreadNotificationsRpcQuery = async (
  client: NotificationCountRpcClient,
): Promise<number> => {
  const { data, error } = await client.rpc(
    "rpc_count_unread_notifications_for_user",
  );

  if (error) {
    throw new Error(error.message);
  }

  if (typeof data === "number" && Number.isFinite(data)) {
    return data;
  }

  const parsed = Number(data ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export {
  countUnreadNotificationsRpcQuery as default,
  countUnreadNotificationsRpcQuery,
};

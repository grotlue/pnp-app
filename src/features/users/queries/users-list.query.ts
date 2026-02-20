import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type { UserListEntry } from "@/features/users/types";

const getUsersList = async (
  session: ClientSession,
): Promise<UserListEntry[]> => {
  const response = await apiRequest<UserListEntry[]>("/api/users?limit=1000", {
    session,
  });
  return unwrapApiResponse(response, "Failed to load users");
};

export { getUsersList as default, getUsersList };

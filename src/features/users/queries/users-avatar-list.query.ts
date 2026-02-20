import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type { UserAvatarListEntry } from "@/features/users/types";

export async function getUsersAvatarList(
  session: ClientSession,
): Promise<UserAvatarListEntry[]> {
  const response = await apiRequest<UserAvatarListEntry[]>(
    "/api/users/avatars?limit=1000",
    {
      session,
    },
  );
  return unwrapApiResponse(response, "Failed to load user avatars");
}

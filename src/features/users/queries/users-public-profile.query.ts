import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type { PublicUserProfile } from "@/features/users/types";

const getPublicUserProfile = async (
  session: ClientSession,
  userId: string,
): Promise<PublicUserProfile> => {
  const response = await apiRequest<PublicUserProfile>(`/api/users/${userId}`, {
    session,
  });
  return unwrapApiResponse(response, "Failed to load user profile");
};

export { getPublicUserProfile as default, getPublicUserProfile };

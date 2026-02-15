import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type { PublicUserProfile } from "@/features/users/types";

export async function getPublicUserProfile(
  session: ClientSession,
  userId: string,
): Promise<PublicUserProfile> {
  const response = await apiRequest<PublicUserProfile>(`/api/users/${userId}`, { session });
  return unwrapApiResponse(response, "Failed to load user profile");
}

import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type {
  AdminCampaign,
  AdminCharacter,
  AdminUser,
} from "@/features/admin/types";
import type { MeResponse } from "@/features/users/types";

export type AdminBootstrapResponse = {
  me: MeResponse;
  users: AdminUser[];
  campaigns: AdminCampaign[];
  characters: AdminCharacter[];
};

export async function getAdminBootstrap(
  session: ClientSession,
): Promise<AdminBootstrapResponse> {
  const response = await apiRequest<AdminBootstrapResponse>(
    "/api/admin/bootstrap",
    { session },
  );
  return unwrapApiResponse(response, "Failed to load admin dashboard");
}

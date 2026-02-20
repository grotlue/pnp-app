import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type {
  AdminCampaign,
  AdminCharacter,
  AdminUser,
} from "@/features/admin/types";
import type { MeResponse } from "@/features/users/types";

type AdminBootstrapResponse = {
  me: MeResponse;
  users: AdminUser[];
  campaigns: AdminCampaign[];
  characters: AdminCharacter[];
};

const getAdminBootstrap = async (
  session: ClientSession,
): Promise<AdminBootstrapResponse> => {
  const response = await apiRequest<AdminBootstrapResponse>(
    "/api/admin/bootstrap",
    { session },
  );
  return unwrapApiResponse(response, "Failed to load admin dashboard");
};

export { getAdminBootstrap as default, getAdminBootstrap };
export type { AdminBootstrapResponse };

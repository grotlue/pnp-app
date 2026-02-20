import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";

const decideNotificationMembershipMutation = async (
  session: ClientSession,
  input: {
    campaignId: string;
    membershipId: string;
    state: "accepted" | "rejected";
  },
): Promise<{ decided: boolean }> => {
  const response = await apiRequest<{ decided: boolean }>(
    `/api/campaigns/${input.campaignId}/memberships/${input.membershipId}/decision`,
    {
      method: "POST",
      session,
      body: { state: input.state },
    },
  );
  return unwrapApiResponse(response, "Failed to decide membership");
};

export {
  decideNotificationMembershipMutation as default,
  decideNotificationMembershipMutation,
};

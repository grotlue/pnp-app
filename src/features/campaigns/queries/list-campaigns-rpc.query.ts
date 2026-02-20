import type {
  CampaignListScope,
  CampaignRpcRow,
} from "@/features/campaigns/types";

type CampaignRpcClient = {
  rpc: (
    fn: "rpc_list_campaigns_for_user",
    args: {
      p_scope: CampaignListScope;
      p_role_for_user_id: string | null;
      p_limit: number;
    },
  ) => PromiseLike<{
    data: CampaignRpcRow[] | null;
    error: { message: string } | null;
  }>;
};

type ListCampaignsRpcQueryParams = {
  scope: CampaignListScope;
  roleForUserId: string | null;
  limit: number;
};

const listCampaignsRpcQuery = async (
  client: CampaignRpcClient,
  params: ListCampaignsRpcQueryParams,
): Promise<CampaignRpcRow[]> => {
  const { data, error } = await client.rpc("rpc_list_campaigns_for_user", {
    p_scope: params.scope,
    p_role_for_user_id: params.roleForUserId,
    p_limit: params.limit,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
};

export { listCampaignsRpcQuery as default, listCampaignsRpcQuery };

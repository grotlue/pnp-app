import type { Campaign, CampaignRpcRow } from "@/features/campaigns/types";

const mapCampaignRpcRow = (row: CampaignRpcRow): Campaign => {
  return {
    id: row.id,
    owner_user_id: row.owner_user_id,
    title: row.title,
    description: row.description,
    is_private: row.is_private,
    created_at: row.created_at,
    updated_at: row.updated_at,
    owner_username: row.owner_username,
    owner_role: row.owner_role,
    player_count: row.player_count,
    current_user_role: row.current_user_role,
    role_for_user: row.role_for_user,
  };
};

export { mapCampaignRpcRow as default, mapCampaignRpcRow };

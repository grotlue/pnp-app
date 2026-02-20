type CampaignListScope = "all" | "public" | "member";
type CampaignRole = "owner" | "player";

type Campaign = {
  id: string;
  owner_user_id: string;
  owner_username?: string | null;
  owner_role?: "user" | "admin" | null;
  title: string;
  description: string;
  player_count?: number;
  current_user_role?: CampaignRole | null;
  role_for_user?: CampaignRole | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_private?: boolean;
};

type CampaignRpcRow = {
  id: string;
  owner_user_id: string;
  title: string;
  description: string;
  is_private: boolean;
  created_at: string | null;
  updated_at: string | null;
  owner_username: string | null;
  owner_role: "user" | "admin" | null;
  player_count: number;
  current_user_role: CampaignRole | null;
  role_for_user: CampaignRole | null;
};

type CampaignMembership = {
  id: string;
  user_id: string;
  state: "pending" | "accepted" | "rejected";
  source: "invite" | "request";
};

type CampaignDetail = {
  campaign: Campaign;
  memberships: CampaignMembership[];
};

type UserEntry = {
  id: string;
  username: string;
  role?: "user" | "admin";
};

type MeResponse = {
  user: {
    id: string;
  };
  profile?: {
    role?: "user" | "admin";
  };
};

type CampaignFormValues = {
  title: string;
  description: string;
  isPrivate?: boolean;
};

export type {
  Campaign,
  CampaignDetail,
  CampaignFormValues,
  CampaignListScope,
  CampaignMembership,
  CampaignRole,
  CampaignRpcRow,
  MeResponse,
  UserEntry,
};

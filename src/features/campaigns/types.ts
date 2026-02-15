export type Campaign = {
  id: string;
  owner_user_id: string;
  owner_username?: string | null;
  owner_role?: "user" | "admin" | null;
  title: string;
  description: string;
  player_count?: number;
  current_user_role?: "owner" | "player" | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_private?: boolean;
};

export type CampaignMembership = {
  id: string;
  user_id: string;
  state: "pending" | "accepted" | "rejected";
  source: "invite" | "request";
};

export type CampaignDetail = {
  campaign: Campaign;
  memberships: CampaignMembership[];
};

export type UserEntry = {
  id: string;
  username: string;
  role?: "user" | "admin";
};

export type MeResponse = {
  user: {
    id: string;
  };
  profile?: {
    role?: "user" | "admin";
  };
};

export type CampaignFormValues = {
  title: string;
  description: string;
  isPrivate?: boolean;
};

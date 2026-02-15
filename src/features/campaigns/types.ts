export type Campaign = {
  id: string;
  owner_user_id: string;
  title: string;
  description: string;
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

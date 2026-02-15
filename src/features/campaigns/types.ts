export type Campaign = {
  id: string;
  owner_user_id: string;
  title: string;
  description: string;
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
};

export type MeResponse = {
  user: {
    id: string;
  };
};

export type CampaignFormValues = {
  title: string;
  description: string;
};

import type { Campaign } from "@/features/campaigns/types";
import type { Character } from "@/features/characters/types";

export type AdminUser = {
  id: string;
  email: string;
  username: string;
  description: string;
  locale: "en" | "de";
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
};

export type AdminCreateUserInput = {
  email: string;
  password: string;
  username: string;
  description: string;
  locale: "en" | "de";
};

export type AdminUpdateUserInput = {
  email?: string;
  password?: string;
  username?: string;
  description?: string;
  locale?: "en" | "de";
};

export type AdminCampaign = Campaign & {
  created_at?: string;
  updated_at?: string;
};

export type AdminCreateCampaignInput = {
  ownerUserId: string;
  title: string;
  description: string;
};

export type AdminUpdateCampaignInput = {
  ownerUserId?: string;
  title?: string;
  description?: string;
};

export type AdminCharacter = Character & {
  created_at?: string;
  updated_at?: string;
};

export type AdminCreateCharacterInput = {
  ownerUserId: string;
  campaignId?: string | null;
  type: "player" | "npc";
  name: string;
  age?: number | null;
  description?: string;
  avatarPath?: string | null;
};

export type AdminUpdateCharacterInput = {
  ownerUserId?: string;
  campaignId?: string | null;
  type?: "player" | "npc";
  name?: string;
  age?: number | null;
  description?: string;
  avatarPath?: string | null;
};

import type { Campaign } from "@/features/campaigns/types";
import type { Character } from "@/features/characters/types";

type AdminUser = {
  id: string;
  email: string;
  username: string;
  description: string;
  locale: "en" | "de";
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
};

type AdminCreateUserInput = {
  email: string;
  password: string;
  username: string;
  description: string;
  locale: "en" | "de";
};

type AdminUpdateUserInput = {
  email?: string;
  password?: string;
  username?: string;
  description?: string;
  locale?: "en" | "de";
};

type AdminCampaign = Campaign & {
  created_at?: string;
  updated_at?: string;
};

type AdminCreateCampaignInput = {
  ownerUserId: string;
  title: string;
  description: string;
  isPrivate?: boolean;
};

type AdminUpdateCampaignInput = {
  ownerUserId?: string;
  title?: string;
  description?: string;
  isPrivate?: boolean;
};

type AdminCharacter = Character & {
  created_at?: string;
  updated_at?: string;
};

type AdminCreateCharacterInput = {
  ownerUserId: string;
  campaignId?: string | null;
  type: "player" | "npc";
  name: string;
  age?: number | null;
  description?: string;
  avatarPath?: string | null;
  isPrivate?: boolean;
};

type AdminUpdateCharacterInput = {
  ownerUserId?: string;
  campaignId?: string | null;
  type?: "player" | "npc";
  name?: string;
  age?: number | null;
  description?: string;
  avatarPath?: string | null;
  isPrivate?: boolean;
};

export type {
  AdminCampaign,
  AdminCharacter,
  AdminCreateCampaignInput,
  AdminCreateCharacterInput,
  AdminCreateUserInput,
  AdminUpdateCampaignInput,
  AdminUpdateCharacterInput,
  AdminUpdateUserInput,
  AdminUser,
};

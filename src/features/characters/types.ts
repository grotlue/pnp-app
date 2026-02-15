export type CharacterId = string;

export type CharacterType = "player" | "npc";

export type Character = {
  id: string;
  owner_user_id: string;
  campaign_id: string | null;
  type: CharacterType;
  name: string;
  age: number | null;
  description: string;
  avatar_path?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_private?: boolean;
};

export type CharacterCreateInput = {
  type: CharacterType;
  name: string;
  age: number | null;
  description: string;
  isPrivate?: boolean;
};

export type CharacterUpdateInput = {
  name: string;
  age: number | null;
  type: CharacterType;
  avatarPath: string | null;
  description: string;
  isPrivate?: boolean;
};

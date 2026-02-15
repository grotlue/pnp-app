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
};

export type CharacterCreateInput = {
  type: CharacterType;
  name: string;
  age: number | null;
  description: string;
};

export type CharacterUpdateInput = {
  name: string;
  age: number | null;
  type: CharacterType;
  avatarPath: string | null;
  description: string;
};

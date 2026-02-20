import type { Character } from "@/features/characters/types";
import { normalizeListQuery } from "@/lib/utils/list";

type CharacterListSort = "updated_desc" | "created_desc" | "name_asc";
type CharacterOwnershipFilter = "all" | "mine" | "others";

const toTimestamp = (value?: string | null): number => {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const sortCharacters = (
  items: Character[],
  sort: CharacterListSort,
): Character[] => {
  const copy = [...items];
  copy.sort((left, right) => {
    if (sort === "name_asc") {
      return left.name.localeCompare(right.name, undefined, {
        sensitivity: "base",
      });
    }

    const leftTimestamp =
      sort === "updated_desc"
        ? toTimestamp(left.updated_at)
        : toTimestamp(left.created_at);
    const rightTimestamp =
      sort === "updated_desc"
        ? toTimestamp(right.updated_at)
        : toTimestamp(right.created_at);
    return rightTimestamp - leftTimestamp;
  });
  return copy;
};

const searchCharacters = (items: Character[], query: string): Character[] => {
  const normalizedQuery = normalizeListQuery(query);
  if (!normalizedQuery) {
    return items;
  }

  return items.filter((character) => {
    const haystack = normalizeListQuery(
      `${character.name} ${character.description ?? ""} ${character.type}`,
    );
    return haystack.includes(normalizedQuery);
  });
};

const filterCharactersByOwnership = (
  items: Character[],
  filter: CharacterOwnershipFilter,
  currentUserId?: string,
): Character[] => {
  if (!currentUserId || filter === "all") {
    return items;
  }

  if (filter === "mine") {
    return items.filter(
      (character) => character.owner_user_id === currentUserId,
    );
  }

  return items.filter((character) => character.owner_user_id !== currentUserId);
};

export type { CharacterListSort, CharacterOwnershipFilter };
export { filterCharactersByOwnership, searchCharacters, sortCharacters };

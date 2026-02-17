import { describe, expect, it } from "vitest";
import {
  filterCharactersByOwnership,
  searchCharacters,
  sortCharacters,
} from "../character-list.logic";

const characters = [
  {
    id: "c-1",
    owner_user_id: "u-1",
    campaign_id: null,
    type: "player" as const,
    name: "Aria",
    age: 21,
    description: "Scout",
    created_at: "2026-01-01T10:00:00.000Z",
    updated_at: "2026-01-02T10:00:00.000Z",
  },
  {
    id: "c-2",
    owner_user_id: "u-2",
    campaign_id: null,
    type: "npc" as const,
    name: "Borin",
    age: 45,
    description: "Blacksmith",
    created_at: "2026-01-03T10:00:00.000Z",
    updated_at: "2026-01-04T10:00:00.000Z",
  },
] as const;

describe("character-list.logic", () => {
  it("sorts by name ascending", () => {
    const sorted = sortCharacters([...characters], "name_asc");
    expect(sorted.map((entry) => entry.name)).toEqual(["Aria", "Borin"]);
  });

  it("sorts by updated date descending", () => {
    const sorted = sortCharacters([...characters], "updated_desc");
    expect(sorted.map((entry) => entry.id)).toEqual(["c-2", "c-1"]);
  });

  it("filters by search query", () => {
    const filtered = searchCharacters([...characters], "smith");
    expect(filtered.map((entry) => entry.id)).toEqual(["c-2"]);
  });

  it("filters ownership for current user", () => {
    const filtered = filterCharactersByOwnership(
      [...characters],
      "mine",
      "u-1",
    );
    expect(filtered.map((entry) => entry.id)).toEqual(["c-1"]);
  });
});

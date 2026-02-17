import { describe, expect, it } from "vitest";
import { searchCampaigns, sortCampaigns } from "../campaign-list.logic";

const campaigns = [
  {
    id: "cp-1",
    owner_user_id: "u-1",
    owner_username: "anna",
    title: "Amber Road",
    description: "Caravan route",
    created_at: "2026-01-02T10:00:00.000Z",
    updated_at: "2026-01-03T10:00:00.000Z",
  },
  {
    id: "cp-2",
    owner_user_id: "u-2",
    owner_username: "bert",
    title: "Zenith Keep",
    description: "Castle intrigue",
    created_at: "2026-01-04T10:00:00.000Z",
    updated_at: "2026-01-05T10:00:00.000Z",
  },
] as const;

describe("campaign-list.logic", () => {
  it("sorts by title", () => {
    const sorted = sortCampaigns([...campaigns], "name_asc");
    expect(sorted.map((entry) => entry.title)).toEqual([
      "Amber Road",
      "Zenith Keep",
    ]);
  });

  it("sorts by updated descending", () => {
    const sorted = sortCampaigns([...campaigns], "updated_desc");
    expect(sorted.map((entry) => entry.id)).toEqual(["cp-2", "cp-1"]);
  });

  it("searches in title/description/owner username", () => {
    const filtered = searchCampaigns([...campaigns], "bert");
    expect(filtered.map((entry) => entry.id)).toEqual(["cp-2"]);
  });
});

import { describe, expect, it } from "vitest";
import { isCampaignOwner } from "../campaign-role.logic";

describe("isCampaignOwner", () => {
  const campaign = {
    id: "c1",
    owner_user_id: "owner-1",
    title: "Campaign",
    description: "",
  };

  it("returns true when user is owner", () => {
    expect(isCampaignOwner(campaign, "owner-1")).toBe(true);
  });

  it("returns false when user is not owner", () => {
    expect(isCampaignOwner(campaign, "other-user")).toBe(false);
  });

  it("returns false when userId is empty", () => {
    expect(isCampaignOwner(campaign, null)).toBe(false);
    expect(isCampaignOwner(campaign, undefined)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { canManageCampaign, canManageCharacter, isAdmin } from "../role.logic";

describe("role.logic", () => {
  it("isAdmin returns true only for admin role", () => {
    expect(isAdmin("admin")).toBe(true);
    expect(isAdmin("user")).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });

  it("allows owners to manage campaigns and characters", () => {
    expect(canManageCampaign({ isOwner: true, role: "user", isPrivate: true })).toBe(true);
    expect(canManageCharacter({ isOwner: true, role: "user", isPrivate: true })).toBe(true);
  });

  it("allows admins only for non-private items", () => {
    expect(canManageCampaign({ isOwner: false, role: "admin", isPrivate: false })).toBe(true);
    expect(canManageCampaign({ isOwner: false, role: "admin", isPrivate: true })).toBe(false);
    expect(canManageCharacter({ isOwner: false, role: "admin", isPrivate: false })).toBe(true);
    expect(canManageCharacter({ isOwner: false, role: "admin", isPrivate: true })).toBe(false);
  });
});

export type AppRole = "admin" | "user" | null | undefined;

export function isAdmin(role: AppRole): role is "admin" {
  return role === "admin";
}

export function canManageCampaign(input: {
  isOwner: boolean;
  role: AppRole;
  isPrivate: boolean | null | undefined;
}): boolean {
  if (input.isOwner) {
    return true;
  }

  return isAdmin(input.role) && !input.isPrivate;
}

export function canManageCharacter(input: {
  isOwner: boolean;
  role: AppRole;
  isPrivate: boolean | null | undefined;
}): boolean {
  if (input.isOwner) {
    return true;
  }

  return isAdmin(input.role) && !input.isPrivate;
}

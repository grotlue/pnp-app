type AppRole = "admin" | "user" | null | undefined;

const isAdmin = (role: AppRole): role is "admin" => {
  return role === "admin";
};

const canManageCampaign = (input: {
  isOwner: boolean;
  role: AppRole;
  isPrivate: boolean | null | undefined;
}): boolean => {
  if (input.isOwner) {
    return true;
  }

  return isAdmin(input.role) && !input.isPrivate;
};

const canManageCharacter = (input: {
  isOwner: boolean;
  role: AppRole;
  isPrivate: boolean | null | undefined;
}): boolean => {
  if (input.isOwner) {
    return true;
  }

  return isAdmin(input.role) && !input.isPrivate;
};

export { canManageCampaign, canManageCharacter, isAdmin, type AppRole };

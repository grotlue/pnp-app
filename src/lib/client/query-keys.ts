const campaignsRoot = ["campaigns"] as const;
const charactersRoot = ["characters"] as const;
const notificationsRoot = ["notifications"] as const;

const queryKeys = {
  me: (token: string) => ["me", token] as const,
  homeLoggedIn: (token: string) => ["home", "logged-in", token] as const,
  adminMfaStatus: (token: string) => ["admin", "mfa", "status", token] as const,
  adminBootstrap: (token: string) => ["admin", "bootstrap", token] as const,
  campaigns: () => campaignsRoot,
  campaignsScreen: (token: string) => ["campaigns", "screen", token] as const,
  campaignDetail: (campaignId: string, token: string) =>
    ["campaigns", "detail", campaignId, token] as const,
  characters: () => charactersRoot,
  charactersScreen: (token: string) => ["characters", "screen", token] as const,
  characterDetail: (characterId: string, token: string) =>
    ["characters", "detail", characterId, token] as const,
  characterEdit: (characterId: string, token: string) =>
    ["characters", "edit", characterId, token] as const,
  characterAvatar: (characterId: string, avatarPath: string, token: string) =>
    ["characters", "detail", "avatar", characterId, avatarPath, token] as const,
  notifications: () => notificationsRoot,
  notificationsList: (token: string, limit: number) =>
    ["notifications", "list", token, limit] as const,
  notificationsUnreadCount: (token: string) =>
    ["notifications", "unread-count", token] as const,
  usersPublicProfile: (userId: string, token: string) =>
    ["users", "public-profile", userId, token] as const,
};

export { queryKeys as default, queryKeys };

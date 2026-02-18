export const queryKeys = {
  me: (token: string) => ["me", token] as const,
  adminMfaStatus: (token: string) => ["admin", "mfa", "status", token] as const,
  adminBootstrap: (token: string) => ["admin", "bootstrap", token] as const,
  campaignsScreen: (token: string) => ["campaigns", "screen", token] as const,
  charactersScreen: (token: string) => ["characters", "screen", token] as const,
  characterDetail: (characterId: string, token: string) =>
    ["characters", "detail", characterId, token] as const,
  characterEdit: (characterId: string, token: string) =>
    ["characters", "edit", characterId, token] as const,
};

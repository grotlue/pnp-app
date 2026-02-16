export const queryKeys = {
  me: (token: string) => ["me", token] as const,
  adminBootstrap: (token: string) => ["admin", "bootstrap", token] as const,
  campaignsScreen: (token: string) => ["campaigns", "screen", token] as const,
  charactersScreen: (token: string) => ["characters", "screen", token] as const,
};

export const E2E_USERS = {
  smokePlayer: {
    email: "solo1.local@pnp.test",
    password: "DevPass123!",
  },
  playerOne: {
    email: "player1.local@pnp.test",
    password: "DevPass123!",
  },
} as const;

export const E2E_NOTIFICATIONS = {
  smokeRelationshipTitle: "Aldric Sternklinge -> Yara Nebelblick",
} as const;

export const E2E_CAMPAIGNS = {
  fixtureCampaignTitle: "Schatten ueber Talheim",
} as const;

export const E2E_CHARACTERS = {
  playerOneCampaignCharacter: "Aldric Sternklinge",
} as const;

export function uniqueSmokeName(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

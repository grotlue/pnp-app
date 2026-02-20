const E2E_USERS = {
  admin: {
    email: "admin@pnp.test",
    password: "AdminSecure123",
  },
  smokePlayer: {
    email: "solo1.local@pnp.test",
    password: "PlayerSecure123",
  },
  playerOne: {
    email: "player1.local@pnp.test",
    password: "PlayerSecure123",
  },
} as const;

const E2E_NOTIFICATIONS = {
  smokeRelationshipTitle: "Aldric Sternklinge -> Yara Nebelblick",
} as const;

const E2E_CAMPAIGNS = {
  fixtureCampaignTitle: "Schatten ueber Talheim",
} as const;

const E2E_CHARACTERS = {
  playerOneCampaignCharacter: "Aldric Sternklinge",
} as const;

const uniqueSmokeName = (prefix: string): string => {
  return `${prefix} ${Date.now()}`;
};

export {
  E2E_CAMPAIGNS,
  E2E_CHARACTERS,
  E2E_NOTIFICATIONS,
  E2E_USERS,
  uniqueSmokeName,
};

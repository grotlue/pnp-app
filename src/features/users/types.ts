export type UserId = string;

export type MeResponse = {
  user: {
    id: string;
    email?: string;
  };
  profile: {
    username: string;
    description: string;
    locale: "en" | "de";
  };
};

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

export type RegisterResponse = {
  emailVerificationRequired: boolean;
};

export type AuthCodeExchangeResponse = LoginResponse & {
  user?: {
    id: string;
    email?: string;
  };
};

export type AuthVerifyResponse = {
  verified: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
};

export type PasswordResetConfirmResponse = {
  updated: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
};

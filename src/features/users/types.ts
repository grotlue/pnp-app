export type UserId = string;

export type MeResponse = {
  user: {
    id: string;
    email?: string;
  };
  profile: {
    username: string;
    description: string;
    avatar_path?: string | null;
    locale: "en" | "de";
    role?: "user" | "admin";
  };
};

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  locale?: "en" | "de";
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

export type PasswordResetRequestResponse = {
  requested: boolean;
  previewRecoveryLink?: string;
};

export type AdminMfaFactor = {
  id: string;
  friendlyName: string | null;
  status: "verified" | "unverified";
  createdAt: string;
  lastChallengedAt: string | null;
};

export type AdminMfaStatusResponse = {
  isAdmin: boolean;
  mfaRequired: boolean;
  currentLevel: "aal1" | "aal2" | null;
  nextLevel: "aal1" | "aal2" | null;
  hasVerifiedTotp: boolean;
  factors: AdminMfaFactor[];
};

export type AdminMfaEnrollResponse = {
  factorId: string;
  friendlyName: string | null;
  qrCode: string;
  secret: string;
  uri: string;
};

export type AdminMfaVerifyResponse = {
  verified: boolean;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

export type PublicUserProfile = {
  id: string;
  username: string;
  description: string;
  avatar_path: string | null;
  locale: "en" | "de";
};

export type UserListEntry = {
  id: string;
  username: string;
  role?: "user" | "admin";
};

export type UserAvatarListEntry = {
  id: string;
  username: string;
  avatarPath: string | null;
  avatarUrl: string | null;
};

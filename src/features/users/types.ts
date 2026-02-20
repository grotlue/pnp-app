type UserId = string;

type MeResponse = {
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

type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  locale?: "en" | "de";
};

type RegisterResponse = {
  emailVerificationRequired: boolean;
};

type AuthCodeExchangeResponse = LoginResponse & {
  user?: {
    id: string;
    email?: string;
  };
};

type AuthVerifyResponse = {
  verified: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
};

type PasswordResetConfirmResponse = {
  updated: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
};

type PasswordResetRequestResponse = {
  requested: boolean;
  previewRecoveryLink?: string;
};

type AdminMfaFactor = {
  id: string;
  friendlyName: string | null;
  status: "verified" | "unverified";
  createdAt: string;
  lastChallengedAt: string | null;
};

type AdminMfaStatusResponse = {
  isAdmin: boolean;
  mfaRequired: boolean;
  currentLevel: "aal1" | "aal2" | null;
  nextLevel: "aal1" | "aal2" | null;
  hasVerifiedTotp: boolean;
  factors: AdminMfaFactor[];
};

type AdminMfaEnrollResponse = {
  factorId: string;
  friendlyName: string | null;
  qrCode: string;
  secret: string;
  uri: string;
};

type AdminMfaVerifyResponse = {
  verified: boolean;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

type PublicUserProfile = {
  id: string;
  username: string;
  description: string;
  avatar_path: string | null;
  locale: "en" | "de";
};

type UserListEntry = {
  id: string;
  username: string;
  role?: "user" | "admin";
};

export type {
  AdminMfaEnrollResponse,
  AdminMfaFactor,
  AdminMfaStatusResponse,
  AdminMfaVerifyResponse,
  AuthCodeExchangeResponse,
  AuthVerifyResponse,
  LoginResponse,
  MeResponse,
  PasswordResetConfirmResponse,
  PasswordResetRequestResponse,
  PublicUserProfile,
  RegisterResponse,
  UserId,
  UserListEntry,
};

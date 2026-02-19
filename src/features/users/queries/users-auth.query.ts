import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import type {
  AuthCodeExchangeResponse,
  AuthVerifyResponse,
  LoginResponse,
  PasswordResetConfirmResponse,
  PasswordResetRequestResponse,
  RegisterResponse,
} from "../types";

export async function loginUser(input: {
  email: string;
  password: string;
  captchaToken?: string;
}): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: input,
  });
  return unwrapApiResponse(response, "Login failed");
}

export async function registerUser(input: {
  username: string;
  email: string;
  password: string;
  locale: "en" | "de";
  captchaToken?: string;
}): Promise<RegisterResponse> {
  const response = await apiRequest<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: input,
  });
  return unwrapApiResponse(response, "Registration failed");
}

export async function requestPasswordReset(input: {
  email: string;
  captchaToken?: string;
}): Promise<PasswordResetRequestResponse> {
  const response = await apiRequest<PasswordResetRequestResponse>(
    "/api/auth/password-reset/request",
    {
      method: "POST",
      body: input,
    },
  );
  return unwrapApiResponse(response, "Password reset request failed");
}

export async function logoutUser(
  session: ClientSession,
): Promise<{ success: boolean }> {
  const response = await apiRequest<{ success: boolean }>("/api/auth/logout", {
    method: "POST",
    session,
  });
  return unwrapApiResponse(response, "Logout failed");
}

export async function exchangeAuthCode(input: {
  code: string;
}): Promise<AuthCodeExchangeResponse> {
  const response = await apiRequest<AuthCodeExchangeResponse>(
    "/api/auth/callback/exchange",
    {
      method: "POST",
      body: input,
    },
  );
  return unwrapApiResponse(response, "Auth code exchange failed");
}

export async function verifyAuthToken(input: {
  tokenHash: string;
  type: "signup" | "recovery" | "email" | "email_change";
}): Promise<AuthVerifyResponse> {
  const response = await apiRequest<AuthVerifyResponse>(
    "/api/auth/callback/verify",
    {
      method: "POST",
      body: input,
    },
  );
  return unwrapApiResponse(response, "Token verification failed");
}

export async function confirmPasswordReset(input: {
  accessToken: string;
  refreshToken: string;
  newPassword: string;
}): Promise<PasswordResetConfirmResponse> {
  const response = await apiRequest<PasswordResetConfirmResponse>(
    "/api/auth/password-reset/confirm",
    {
      method: "POST",
      body: input,
    },
  );
  return unwrapApiResponse(response, "Password reset confirm failed");
}

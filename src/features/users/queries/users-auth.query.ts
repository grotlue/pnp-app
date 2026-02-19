import { apiRequest, unwrapApiResponse } from "@/lib/client/api";
import type { ClientSession } from "@/lib/client/session";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import type {
  AuthCodeExchangeResponse,
  AuthVerifyResponse,
  LoginResponse,
  PasswordResetConfirmResponse,
  RegisterResponse,
} from "../types";

function getBrowserOrigin(): string {
  if (typeof window === "undefined") {
    throw new Error("Auth actions must run in the browser.");
  }

  return window.location.origin;
}

export async function loginUser(input: {
  email: string;
  password: string;
  captchaToken?: string;
}): Promise<LoginResponse> {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
    options: input.captchaToken
      ? { captchaToken: input.captchaToken }
      : undefined,
  });

  if (error || !data.session) {
    throw new Error(error?.message ?? "Login failed");
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at,
  };
}

export async function registerUser(input: {
  username: string;
  email: string;
  password: string;
  locale: "en" | "de";
  captchaToken?: string;
}): Promise<RegisterResponse> {
  const supabase = getBrowserSupabaseClient();
  const redirectTo = `${getBrowserOrigin()}/auth/confirm?next=/`;
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: redirectTo,
      ...(input.captchaToken ? { captchaToken: input.captchaToken } : {}),
      data: {
        username: input.username,
        locale: input.locale,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    emailVerificationRequired: data.session === null,
  };
}

export async function requestPasswordReset(input: {
  email: string;
  captchaToken?: string;
}): Promise<{ requested: boolean }> {
  const supabase = getBrowserSupabaseClient();
  const redirectTo = `${getBrowserOrigin()}/auth/confirm?next=/auth/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo,
    ...(input.captchaToken ? { captchaToken: input.captchaToken } : {}),
  });

  if (error) {
    throw new Error(error.message);
  }

  return { requested: true };
}

export async function logoutUser(
  session: ClientSession,
): Promise<{ success: boolean }> {
  void session;
  const supabase = getBrowserSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
  return { success: true };
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

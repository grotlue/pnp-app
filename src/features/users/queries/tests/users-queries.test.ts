import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequestMock, unwrapApiResponseMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
  unwrapApiResponseMock: vi.fn(),
}));

vi.mock("@/lib/client/api", () => ({
  apiRequest: apiRequestMock,
  unwrapApiResponse: unwrapApiResponseMock,
}));

import {
  confirmPasswordReset,
  exchangeAuthCode,
  loginUser,
  logoutUser,
  registerUser,
  resendVerificationEmail,
  requestPasswordReset,
  verifyAuthToken,
} from "../users-auth.query";
import {
  enrollAdminTotp,
  getAdminMfaStatus,
  verifyAdminTotp,
} from "../users-mfa.query";
import { getMe, updateMyProfile } from "../users-profile.query";
import { deleteMyAccount, updateMyEmail, updateMyPassword } from "../users-settings.query";

const session = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
};

beforeEach(() => {
  vi.clearAllMocks();
  unwrapApiResponseMock.mockImplementation((response: { data: unknown }) => response.data);
});

describe("users auth/profile/settings queries", () => {
  it("loginUser posts login payload", async () => {
    const response = { data: { accessToken: "a1" }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(loginUser({ email: "x@example.com", password: "secret" })).resolves.toEqual({
      accessToken: "a1",
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      body: { email: "x@example.com", password: "secret" },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Login failed");
  });

  it("loginUser forwards captcha token when provided", async () => {
    const response = { data: { accessToken: "a1" }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(
      loginUser({
        email: "x@example.com",
        password: "secret",
        captchaToken: "captcha-1",
      }),
    ).resolves.toEqual({
      accessToken: "a1",
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      body: { email: "x@example.com", password: "secret", captchaToken: "captcha-1" },
    });
  });

  it("registerUser posts registration payload", async () => {
    const response = {
      data: { emailVerificationRequired: true },
      error: null,
      status: 201,
    };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(
      registerUser({
        username: "user1",
        email: "u@example.com",
        password: "secret",
        locale: "de",
      }),
    ).resolves.toEqual({ emailVerificationRequired: true });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      body: {
        username: "user1",
        email: "u@example.com",
        password: "secret",
        locale: "de",
      },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Register failed");
  });

  it("registerUser forwards captcha token when provided", async () => {
    const response = {
      data: { emailVerificationRequired: true },
      error: null,
      status: 201,
    };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(
      registerUser({
        username: "user1",
        email: "u@example.com",
        password: "secret",
        locale: "de",
        captchaToken: "captcha-2",
      }),
    ).resolves.toEqual({ emailVerificationRequired: true });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      body: {
        username: "user1",
        email: "u@example.com",
        password: "secret",
        locale: "de",
        captchaToken: "captcha-2",
      },
    });
  });

  it("requestPasswordReset posts reset payload", async () => {
    const response = { data: { requested: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(requestPasswordReset({ email: "x@example.com" })).resolves.toEqual({
      requested: true,
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/password-reset/request", {
      method: "POST",
      body: { email: "x@example.com" },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Password reset request failed");
  });

  it("requestPasswordReset forwards captcha token when provided", async () => {
    const response = { data: { requested: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(
      requestPasswordReset({ email: "x@example.com", captchaToken: "captcha-3" }),
    ).resolves.toEqual({
      requested: true,
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/password-reset/request", {
      method: "POST",
      body: { email: "x@example.com", captchaToken: "captcha-3" },
    });
  });

  it("resendVerificationEmail posts resend payload", async () => {
    const response = { data: { sent: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(resendVerificationEmail({ email: "x@example.com" })).resolves.toEqual({
      sent: true,
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/email/resend-verification", {
      method: "POST",
      body: { email: "x@example.com" },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(
      response,
      "Verification email resend failed",
    );
  });

  it("resendVerificationEmail forwards captcha token when provided", async () => {
    const response = { data: { sent: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(
      resendVerificationEmail({ email: "x@example.com", captchaToken: "captcha-4" }),
    ).resolves.toEqual({
      sent: true,
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/email/resend-verification", {
      method: "POST",
      body: { email: "x@example.com", captchaToken: "captcha-4" },
    });
  });

  it("logoutUser sends authenticated logout request", async () => {
    const response = { data: { success: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(logoutUser(session)).resolves.toEqual({ success: true });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
      session,
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Logout failed");
  });

  it("exchangeAuthCode posts callback code", async () => {
    const response = {
      data: { accessToken: "a1", refreshToken: "r1" },
      error: null,
      status: 200,
    };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(exchangeAuthCode({ code: "code-1" })).resolves.toEqual({
      accessToken: "a1",
      refreshToken: "r1",
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/callback/exchange", {
      method: "POST",
      body: { code: "code-1" },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Auth code exchange failed");
  });

  it("verifyAuthToken posts token hash and type", async () => {
    const response = { data: { verified: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(verifyAuthToken({ tokenHash: "th", type: "signup" })).resolves.toEqual({
      verified: true,
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/callback/verify", {
      method: "POST",
      body: { tokenHash: "th", type: "signup" },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Token verification failed");
  });

  it("confirmPasswordReset posts reset confirmation payload", async () => {
    const response = { data: { updated: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(
      confirmPasswordReset({
        accessToken: "a1",
        refreshToken: "r1",
        newPassword: "new-secret",
      }),
    ).resolves.toEqual({ updated: true });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/password-reset/confirm", {
      method: "POST",
      body: {
        accessToken: "a1",
        refreshToken: "r1",
        newPassword: "new-secret",
      },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Password reset confirm failed");
  });

  it("getMe loads profile via /api/me", async () => {
    const response = {
      data: {
        user: { id: "u1" },
        profile: { username: "x", description: "", locale: "en" },
      },
      error: null,
      status: 200,
    };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(getMe(session)).resolves.toEqual(response.data);
    expect(apiRequestMock).toHaveBeenCalledWith("/api/me", { session });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to load profile");
  });

  it("updateMyProfile sends patch payload", async () => {
    const response = { data: { username: "updated" }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(
      updateMyProfile(session, {
        username: "updated",
        description: "desc",
        locale: "de",
      }),
    ).resolves.toEqual({ username: "updated" });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/me/profile", {
      method: "PATCH",
      session,
      body: {
        username: "updated",
        description: "desc",
        locale: "de",
      },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to save profile");
  });

  it("updateMyEmail sends patch payload", async () => {
    const response = { data: { user: { id: "u1" } }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(updateMyEmail(session, { newEmail: "new@example.com" })).resolves.toEqual({
      user: { id: "u1" },
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/me/settings/email", {
      method: "PATCH",
      session,
      body: { newEmail: "new@example.com" },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to update email");
  });

  it("updateMyPassword sends patch payload", async () => {
    const response = { data: { user: { id: "u1" } }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(updateMyPassword(session, { newPassword: "new-secret" })).resolves.toEqual({
      user: { id: "u1" },
    });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/me/settings/password", {
      method: "PATCH",
      session,
      body: { newPassword: "new-secret" },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to update password");
  });

  it("deleteMyAccount sends delete request", async () => {
    const response = { data: { deleted: true }, error: null, status: 200 };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(deleteMyAccount(session)).resolves.toEqual({ deleted: true });
    expect(apiRequestMock).toHaveBeenCalledWith("/api/me", {
      method: "DELETE",
      session,
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to delete account");
  });

  it("getAdminMfaStatus loads MFA status for admin", async () => {
    const response = {
      data: { isAdmin: true, mfaRequired: true, currentLevel: "aal1", nextLevel: "aal2", hasVerifiedTotp: false, factors: [] },
      error: null,
      status: 200,
    };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(getAdminMfaStatus(session)).resolves.toEqual(response.data);
    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/mfa/totp", { session });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to load MFA status");
  });

  it("enrollAdminTotp posts enrollment request", async () => {
    const response = {
      data: { factorId: "f1", friendlyName: "admin", qrCode: "<svg/>", secret: "ABC", uri: "otpauth://..." },
      error: null,
      status: 200,
    };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(enrollAdminTotp(session, { friendlyName: "admin" })).resolves.toEqual(response.data);
    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/mfa/totp", {
      method: "POST",
      session,
      body: { friendlyName: "admin" },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to start MFA setup");
  });

  it("verifyAdminTotp posts verification code", async () => {
    const response = {
      data: { verified: true, accessToken: "a2", refreshToken: "r2", expiresAt: 123456 },
      error: null,
      status: 200,
    };
    apiRequestMock.mockResolvedValueOnce(response);

    await expect(verifyAdminTotp(session, { factorId: "f1", code: "123456" })).resolves.toEqual(
      response.data,
    );
    expect(apiRequestMock).toHaveBeenCalledWith("/api/auth/mfa/totp", {
      method: "PATCH",
      session,
      body: { factorId: "f1", code: "123456" },
    });
    expect(unwrapApiResponseMock).toHaveBeenCalledWith(response, "Failed to verify MFA code");
  });
});

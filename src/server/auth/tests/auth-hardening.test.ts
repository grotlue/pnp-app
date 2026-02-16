import { afterEach, describe, expect, it } from "vitest";
import {
  hasAal2AuthLevel,
  isAdminMfaRequired,
  resolveAuthCaptchaMode,
} from "../auth-hardening";

function buildJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.signature`;
}

function clearEnv() {
  delete process.env.REQUIRE_ADMIN_MFA;
  delete process.env.AUTH_CAPTCHA_MODE;
  delete process.env.APP_ENV;
  delete process.env.VERCEL_ENV;
}

afterEach(() => {
  clearEnv();
});

describe("auth hardening", () => {
  it("requires admin MFA by default in preview", () => {
    process.env.APP_ENV = "preview";
    expect(isAdminMfaRequired()).toBe(true);
  });

  it("does not require admin MFA by default in development", () => {
    process.env.APP_ENV = "development";
    expect(isAdminMfaRequired()).toBe(false);
  });

  it("respects explicit admin MFA override", () => {
    process.env.APP_ENV = "production";
    process.env.REQUIRE_ADMIN_MFA = "false";
    expect(isAdminMfaRequired()).toBe(false);
  });

  it("defaults auth captcha mode to optional in production", () => {
    process.env.APP_ENV = "production";
    expect(resolveAuthCaptchaMode()).toBe("optional");
  });

  it("defaults auth captcha mode to off in development", () => {
    process.env.APP_ENV = "development";
    expect(resolveAuthCaptchaMode()).toBe("off");
  });

  it("respects explicit auth captcha mode", () => {
    process.env.AUTH_CAPTCHA_MODE = "required";
    expect(resolveAuthCaptchaMode()).toBe("required");
  });

  it("accepts quoted auth captcha mode", () => {
    process.env.AUTH_CAPTCHA_MODE = '"off"';
    expect(resolveAuthCaptchaMode()).toBe("off");
  });

  it("detects aal2 from access token claim", () => {
    const token = buildJwt({ aal: "aal2" });
    expect(hasAal2AuthLevel(token)).toBe(true);
  });

  it("returns false when access token does not include aal2", () => {
    const token = buildJwt({ aal: "aal1" });
    expect(hasAal2AuthLevel(token)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  normalizeAndValidateEmail,
  normalizeCaptchaToken,
  normalizeEmail,
  normalizeTotpCode,
  validatePasswordStrength,
} from "../auth-validation";

describe("auth validation helpers", () => {
  it("normalizes email to lowercase and trims", () => {
    expect(normalizeEmail("  User@Example.com ")).toBe("user@example.com");
  });

  it("returns normalized email when valid", () => {
    expect(normalizeAndValidateEmail("  User@Example.com ")).toBe(
      "user@example.com",
    );
  });

  it("returns null for invalid email", () => {
    expect(normalizeAndValidateEmail("not-an-email")).toBeNull();
  });

  it("normalizes captcha token when non-empty", () => {
    expect(normalizeCaptchaToken("  token-123  ")).toBe("token-123");
  });

  it("returns null for empty captcha token", () => {
    expect(normalizeCaptchaToken("   ")).toBeNull();
  });

  it("normalizes valid totp code", () => {
    expect(normalizeTotpCode(" 123 456 ")).toBe("123456");
  });

  it("returns null for invalid totp code", () => {
    expect(normalizeTotpCode("12ab56")).toBeNull();
  });

  it("accepts strong passwords", () => {
    expect(validatePasswordStrength("SecurePass123")).toBeNull();
  });

  it("rejects short passwords", () => {
    expect(validatePasswordStrength("Short1A")).toBe(
      "password must be at least 12 characters",
    );
  });

  it("rejects passwords without lowercase letters", () => {
    expect(validatePasswordStrength("UPPERCASE1234")).toBe(
      "password must include a lowercase letter",
    );
  });

  it("rejects passwords without uppercase letters", () => {
    expect(validatePasswordStrength("lowercase1234")).toBe(
      "password must include an uppercase letter",
    );
  });

  it("rejects passwords without digits", () => {
    expect(validatePasswordStrength("NoDigitsHereAA")).toBe(
      "password must include a number",
    );
  });
});

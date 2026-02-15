import { describe, expect, it } from "vitest";
import { getAuthParamsFromUrl, getSessionTokensFromUrl } from "./auth-session-from-url";

function toLocation(url: string): Location {
  return new URL(url) as unknown as Location;
}

describe("auth-session-from-url", () => {
  it("extracts tokens from hash", () => {
    const location = toLocation(
      "https://example.com/auth/callback#access_token=a1&refresh_token=r1&expires_at=123",
    );

    expect(getSessionTokensFromUrl(location)).toEqual({
      accessToken: "a1",
      refreshToken: "r1",
      expiresAt: 123,
    });
  });

  it("returns null when hash tokens are missing", () => {
    const location = toLocation("https://example.com/auth/callback#foo=bar");
    expect(getSessionTokensFromUrl(location)).toBeNull();
  });

  it("parses auth params from query string", () => {
    const location = toLocation(
      "https://example.com/auth/callback?code=c1&token_hash=t1&type=recovery",
    );

    expect(getAuthParamsFromUrl(location)).toEqual({
      code: "c1",
      tokenHash: "t1",
      type: "recovery",
    });
  });

  it("drops unsupported auth types", () => {
    const location = toLocation(
      "https://example.com/auth/callback?code=c1&token_hash=t1&type=invalid",
    );

    expect(getAuthParamsFromUrl(location)).toEqual({
      code: "c1",
      tokenHash: "t1",
      type: undefined,
    });
  });
});

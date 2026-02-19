import { afterEach, describe, expect, it } from "vitest";
import { resolveSafeRedirectUrl } from "../security";

const ORIGINAL_ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS;

afterEach(() => {
  process.env.ALLOWED_ORIGINS = ORIGINAL_ALLOWED_ORIGINS;
});

describe("resolveSafeRedirectUrl", () => {
  it("builds redirect URL from request origin header", () => {
    process.env.ALLOWED_ORIGINS = "";

    const request = new Request("http://127.0.0.1:3000/api/auth/register", {
      method: "POST",
      headers: {
        origin: "http://127.0.0.1:3000",
      },
    });

    expect(resolveSafeRedirectUrl(request, "/auth/confirm?next=/")).toBe(
      "http://127.0.0.1:3000/auth/confirm?next=/",
    );
  });

  it("falls back to request URL origin when origin header is missing", () => {
    process.env.ALLOWED_ORIGINS = "";

    const request = new Request("http://127.0.0.1:3000/api/auth/register", {
      method: "POST",
    });

    expect(resolveSafeRedirectUrl(request, "/auth/confirm?next=/")).toBe(
      "http://127.0.0.1:3000/auth/confirm?next=/",
    );
  });

  it("rejects absolute URLs targeting a different origin", () => {
    process.env.ALLOWED_ORIGINS = "";

    const request = new Request("http://127.0.0.1:3000/api/auth/register", {
      method: "POST",
      headers: {
        origin: "http://127.0.0.1:3000",
      },
    });

    expect(resolveSafeRedirectUrl(request, "https://evil.example/reset")).toBe(
      undefined,
    );
  });

  it("returns undefined when no allowed origin can be resolved", () => {
    process.env.ALLOWED_ORIGINS = "https://app.example.com";

    const request = new Request("http://127.0.0.1:3000/api/auth/register", {
      method: "POST",
      headers: {
        origin: "http://127.0.0.1:3000",
      },
    });

    expect(resolveSafeRedirectUrl(request, "/auth/confirm?next=/")).toBe(
      undefined,
    );
  });
});

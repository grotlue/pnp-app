import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveVercelToolbarEnabled } from "../vercel-toolbar";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("vercel toolbar feature toggle", () => {
  it("enables toolbar in development by default", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_VERCEL_TOOLBAR", undefined);

    expect(resolveVercelToolbarEnabled()).toBe(true);
  });

  it("disables toolbar in production by default", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_VERCEL_TOOLBAR", undefined);

    expect(resolveVercelToolbarEnabled()).toBe(false);
  });

  it("enables toolbar in production when explicitly enabled", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_VERCEL_TOOLBAR", "true");

    expect(resolveVercelToolbarEnabled()).toBe(true);
  });

  it("keeps toolbar enabled in development even when flag is false", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_VERCEL_TOOLBAR", "false");

    expect(resolveVercelToolbarEnabled()).toBe(true);
  });
});

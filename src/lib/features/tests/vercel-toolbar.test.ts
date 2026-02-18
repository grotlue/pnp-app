import { afterEach, describe, expect, it, vi } from "vitest";
import { BOOLEAN_ENV_VALUES, NODE_ENV_VALUES } from "../constants";
import { resolveVercelToolbarEnabled } from "../vercel-toolbar";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("vercel toolbar feature toggle", () => {
  it("enables toolbar in development by default", () => {
    vi.stubEnv("NODE_ENV", NODE_ENV_VALUES.development);
    vi.stubEnv("NEXT_PUBLIC_ENABLE_VERCEL_TOOLBAR", undefined);

    expect(resolveVercelToolbarEnabled()).toBe(true);
  });

  it("disables toolbar in production by default", () => {
    vi.stubEnv("NODE_ENV", NODE_ENV_VALUES.production);
    vi.stubEnv("NEXT_PUBLIC_ENABLE_VERCEL_TOOLBAR", undefined);

    expect(resolveVercelToolbarEnabled()).toBe(false);
  });

  it("enables toolbar in production when explicitly enabled", () => {
    vi.stubEnv("NODE_ENV", NODE_ENV_VALUES.production);
    vi.stubEnv("NEXT_PUBLIC_ENABLE_VERCEL_TOOLBAR", BOOLEAN_ENV_VALUES.true);

    expect(resolveVercelToolbarEnabled()).toBe(true);
  });

  it("keeps toolbar enabled in development even when flag is false", () => {
    vi.stubEnv("NODE_ENV", NODE_ENV_VALUES.development);
    vi.stubEnv("NEXT_PUBLIC_ENABLE_VERCEL_TOOLBAR", BOOLEAN_ENV_VALUES.false);

    expect(resolveVercelToolbarEnabled()).toBe(true);
  });
});

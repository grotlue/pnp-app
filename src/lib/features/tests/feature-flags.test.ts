import { afterEach, describe, expect, it } from "vitest";
import { isFeatureEnabled, resolveRuntimeEnvironment } from "../feature-flags";

function clearFlagEnv() {
  delete process.env.APP_ENV;
  delete process.env.VERCEL_ENV;
  delete process.env.FEATURE_FLAGS_ENABLE;
  delete process.env.FEATURE_FLAGS_DISABLE;
}

afterEach(() => {
  clearFlagEnv();
});

describe("feature flags", () => {
  it("defaults to development environment", () => {
    clearFlagEnv();
    expect(resolveRuntimeEnvironment()).toBe("development");
  });

  it("uses APP_ENV when valid", () => {
    process.env.APP_ENV = "production";
    process.env.VERCEL_ENV = "preview";

    expect(resolveRuntimeEnvironment()).toBe("production");
  });

  it("falls back to VERCEL_ENV when APP_ENV is invalid", () => {
    process.env.APP_ENV = "staging";
    process.env.VERCEL_ENV = "preview";

    expect(resolveRuntimeEnvironment()).toBe("preview");
  });

  it("disables selfRegistration by default in production", () => {
    process.env.APP_ENV = "production";
    expect(isFeatureEnabled("selfRegistration")).toBe(false);
  });

  it("enables selfRegistration in preview by default", () => {
    process.env.APP_ENV = "preview";
    expect(isFeatureEnabled("selfRegistration")).toBe(true);
  });

  it("allows force-enable override", () => {
    process.env.APP_ENV = "production";
    process.env.FEATURE_FLAGS_ENABLE = "selfRegistration";

    expect(isFeatureEnabled("selfRegistration")).toBe(true);
  });

  it("allows force-disable override", () => {
    process.env.APP_ENV = "development";
    process.env.FEATURE_FLAGS_DISABLE = "selfRegistration";

    expect(isFeatureEnabled("selfRegistration")).toBe(false);
  });

  it("prefers disable override over enable override", () => {
    process.env.APP_ENV = "development";
    process.env.FEATURE_FLAGS_ENABLE = "selfRegistration";
    process.env.FEATURE_FLAGS_DISABLE = "selfRegistration";

    expect(isFeatureEnabled("selfRegistration")).toBe(false);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import {
  isFeatureEnabled,
  resolveFeatureFlagProvider,
  resolveRuntimeEnvironment,
} from "../feature-flags";

function clearFlagEnv() {
  delete process.env.APP_ENV;
  delete process.env.VERCEL_ENV;
  delete process.env.FEATURE_FLAGS_PROVIDER;
  delete process.env.FEATURE_FLAGS_ENABLE;
  delete process.env.FEATURE_FLAGS_DISABLE;
  delete process.env.FLAGS;
}

afterEach(() => {
  clearFlagEnv();
});

describe("feature flags", () => {
  it("defaults to development environment", () => {
    clearFlagEnv();
    expect(resolveRuntimeEnvironment()).toBe("development");
  });

  it("defaults to rules provider when FLAGS connection string is not set", () => {
    clearFlagEnv();
    expect(resolveFeatureFlagProvider()).toBe("rules");
  });

  it("uses vercel provider when FLAGS connection string is present", () => {
    process.env.FLAGS = "sdk_123";
    expect(resolveFeatureFlagProvider()).toBe("vercel");
  });

  it("uses explicit feature provider override when valid", () => {
    process.env.FEATURE_FLAGS_PROVIDER = "rules";
    process.env.FLAGS = "sdk_123";

    expect(resolveFeatureFlagProvider()).toBe("rules");
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

  it("disables selfRegistration by default in production", async () => {
    process.env.APP_ENV = "production";
    await expect(isFeatureEnabled("selfRegistration")).resolves.toBe(false);
  });

  it("enables selfRegistration in preview by default", async () => {
    process.env.APP_ENV = "preview";
    await expect(isFeatureEnabled("selfRegistration")).resolves.toBe(true);
  });

  it("allows force-enable override", async () => {
    process.env.APP_ENV = "production";
    process.env.FEATURE_FLAGS_ENABLE = "selfRegistration";

    await expect(isFeatureEnabled("selfRegistration")).resolves.toBe(true);
  });

  it("allows force-disable override", async () => {
    process.env.APP_ENV = "development";
    process.env.FEATURE_FLAGS_DISABLE = "selfRegistration";

    await expect(isFeatureEnabled("selfRegistration")).resolves.toBe(false);
  });

  it("prefers disable override over enable override", async () => {
    process.env.APP_ENV = "development";
    process.env.FEATURE_FLAGS_ENABLE = "selfRegistration";
    process.env.FEATURE_FLAGS_DISABLE = "selfRegistration";

    await expect(isFeatureEnabled("selfRegistration")).resolves.toBe(false);
  });
});

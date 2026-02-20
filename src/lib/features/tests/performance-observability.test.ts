import { afterEach, describe, expect, it } from "vitest";
import {
  resolvePerformanceRuntimeEnvironment,
  resolveSpeedInsightsEnabled,
} from "../performance-observability";

const clearPerformanceEnv = () => {
  delete process.env.APP_ENV;
  delete process.env.VERCEL_ENV;
  delete process.env.ENABLE_VERCEL_SPEED_INSIGHTS;
};

afterEach(() => {
  clearPerformanceEnv();
});

describe("performance observability", () => {
  it("defaults runtime environment to development", () => {
    clearPerformanceEnv();
    expect(resolvePerformanceRuntimeEnvironment()).toBe("development");
  });

  it("prefers APP_ENV over VERCEL_ENV", () => {
    process.env.APP_ENV = "production";
    process.env.VERCEL_ENV = "preview";

    expect(resolvePerformanceRuntimeEnvironment()).toBe("production");
  });

  it("defaults speed insights to enabled in preview", () => {
    process.env.VERCEL_ENV = "preview";
    expect(resolveSpeedInsightsEnabled()).toBe(true);
  });

  it("defaults speed insights to enabled in production", () => {
    process.env.VERCEL_ENV = "production";
    expect(resolveSpeedInsightsEnabled()).toBe(true);
  });

  it("defaults speed insights to disabled in development", () => {
    process.env.VERCEL_ENV = "development";
    expect(resolveSpeedInsightsEnabled()).toBe(false);
  });

  it("allows explicit disable override", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.ENABLE_VERCEL_SPEED_INSIGHTS = "false";
    expect(resolveSpeedInsightsEnabled()).toBe(false);
  });

  it("allows explicit enable override", () => {
    process.env.VERCEL_ENV = "development";
    process.env.ENABLE_VERCEL_SPEED_INSIGHTS = "true";
    expect(resolveSpeedInsightsEnabled()).toBe(true);
  });
});

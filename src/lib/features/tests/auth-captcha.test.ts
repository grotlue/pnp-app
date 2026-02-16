import { afterEach, describe, expect, it } from "vitest";
import {
  getTurnstileSiteKey,
  resolveAuthCaptchaClientConfig,
  resolveClientAuthCaptchaMode,
} from "../auth-captcha";

function clearCaptchaEnv() {
  delete process.env.APP_ENV;
  delete process.env.VERCEL_ENV;
  delete process.env.NEXT_PUBLIC_AUTH_CAPTCHA_MODE;
  delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}

afterEach(() => {
  clearCaptchaEnv();
});

describe("auth captcha client config", () => {
  it("defaults mode to off in development", () => {
    clearCaptchaEnv();
    expect(resolveClientAuthCaptchaMode()).toBe("off");
  });

  it("defaults mode to optional in preview", () => {
    process.env.VERCEL_ENV = "preview";
    expect(resolveClientAuthCaptchaMode()).toBe("optional");
  });

  it("respects explicit mode override", () => {
    process.env.NEXT_PUBLIC_AUTH_CAPTCHA_MODE = "required";
    expect(resolveClientAuthCaptchaMode()).toBe("required");
  });

  it("trims and returns site key", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "  site-key  ";
    expect(getTurnstileSiteKey()).toBe("site-key");
  });

  it("enables captcha when mode is optional and site key is present", () => {
    process.env.NEXT_PUBLIC_AUTH_CAPTCHA_MODE = "optional";
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site-key";

    expect(resolveAuthCaptchaClientConfig()).toEqual({
      mode: "optional",
      required: false,
      siteKey: "site-key",
      enabled: true,
    });
  });

  it("keeps captcha disabled without site key", () => {
    process.env.NEXT_PUBLIC_AUTH_CAPTCHA_MODE = "required";

    expect(resolveAuthCaptchaClientConfig()).toEqual({
      mode: "required",
      required: true,
      siteKey: null,
      enabled: false,
    });
  });
});

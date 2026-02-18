import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "../csp";

describe("content security policy", () => {
  it("does not allow vercel.live when toolbar is disabled", () => {
    const csp = buildContentSecurityPolicy(false);

    expect(csp).not.toContain("https://vercel.live");
    expect(csp).toContain("frame-src 'self' https://challenges.cloudflare.com");
  });

  it("allows vercel.live script, connect, and frame sources when toolbar is enabled", () => {
    const csp = buildContentSecurityPolicy(true);

    expect(csp).toContain(
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://vercel.live",
    );
    expect(csp).toContain(
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://challenges.cloudflare.com https://vercel.live",
    );
    expect(csp).toContain(
      "frame-src 'self' https://challenges.cloudflare.com https://vercel.live",
    );
  });
});

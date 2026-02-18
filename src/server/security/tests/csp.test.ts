import { describe, expect, it } from "vitest";
import { SECURITY_ORIGINS } from "@/lib/security/constants";
import { buildContentSecurityPolicy } from "../csp";
import { CSP_KEYWORDS } from "../constants";

describe("content security policy", () => {
  it("does not allow vercel.live when toolbar is disabled", () => {
    const csp = buildContentSecurityPolicy(false);

    expect(csp).not.toContain(SECURITY_ORIGINS.vercelLive);
    expect(csp).toContain(
      `frame-src ${CSP_KEYWORDS.self} ${SECURITY_ORIGINS.cloudflareChallenges}`,
    );
  });

  it("allows vercel.live script, connect, and frame sources when toolbar is enabled", () => {
    const csp = buildContentSecurityPolicy(true);

    expect(csp).toContain(
      `script-src ${CSP_KEYWORDS.self} ${CSP_KEYWORDS.unsafeInline} ${SECURITY_ORIGINS.cloudflareChallenges} ${SECURITY_ORIGINS.vercelLive}`,
    );
    expect(csp).toContain(
      `connect-src ${CSP_KEYWORDS.self} ${SECURITY_ORIGINS.supabaseCoHttpsWildcard} ${SECURITY_ORIGINS.supabaseInHttpsWildcard} ${SECURITY_ORIGINS.supabaseCoWssWildcard} ${SECURITY_ORIGINS.cloudflareChallenges} ${SECURITY_ORIGINS.vercelLive}`,
    );
    expect(csp).toContain(
      `frame-src ${CSP_KEYWORDS.self} ${SECURITY_ORIGINS.cloudflareChallenges} ${SECURITY_ORIGINS.vercelLive}`,
    );
  });
});

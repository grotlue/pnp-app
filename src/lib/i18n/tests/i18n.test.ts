import { describe, expect, it } from "vitest";
import {
  detectLocaleFromAcceptLanguage,
  getTranslator,
  resolveLocale,
} from "@/lib/i18n/index";

describe("i18n", () => {
  it("uses en as default locale", () => {
    expect(resolveLocale(null)).toBe("en");
    expect(resolveLocale("fr")).toBe("en");
  });

  it("detects de from Accept-Language", () => {
    expect(detectLocaleFromAcceptLanguage("de-DE,de;q=0.9,en;q=0.8")).toBe("de");
    expect(detectLocaleFromAcceptLanguage("en-US,en;q=0.9")).toBe("en");
  });

  it("returns translated values and key fallback", () => {
    const t = getTranslator("de");
    expect(t("ui.actions.reload")).toBe("Neu laden");
    expect(t("unknown.key")).toBe("unknown.key");
  });
});

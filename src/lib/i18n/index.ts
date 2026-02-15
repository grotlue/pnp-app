import en from "@/i18n/en.json";
import de from "@/i18n/de.json";

export type AppLocale = "en" | "de";

type Dict = typeof en;

const dictionaries: Record<AppLocale, Dict> = {
  en,
  de,
};

const DEFAULT_LOCALE: AppLocale = "en";

function getByPath(obj: unknown, path: string): string | undefined {
  if (!obj || typeof obj !== "object") {
    return undefined;
  }

  let current: unknown = obj;
  for (const part of path.split(".")) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

export function resolveLocale(input?: string | null): AppLocale {
  return input === "de" ? "de" : DEFAULT_LOCALE;
}

export function detectLocaleFromAcceptLanguage(
  acceptLanguage?: string | null,
): AppLocale {
  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }

  const normalized = acceptLanguage.toLowerCase();
  if (normalized.includes("de")) {
    return "de";
  }

  return DEFAULT_LOCALE;
}

export function getTranslator(locale: AppLocale) {
  const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];

  return (key: string, fallback?: string): string => {
    const value = getByPath(dict, key);
    if (value) {
      return value;
    }

    if (fallback) {
      return fallback;
    }

    return key;
  };
}

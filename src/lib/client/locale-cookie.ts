"use client";

import { type AppLocale, resolveLocale } from "@/lib/i18n";

const LOCALE_COOKIE_NAME = "locale";
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

const readLocaleCookie = (): AppLocale | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const parts = document.cookie.split("; ");
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === LOCALE_COOKIE_NAME && value) {
      return resolveLocale(decodeURIComponent(value));
    }
  }

  return null;
};

const setLocaleCookie = (locale: AppLocale): void => {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)}; Path=/; Max-Age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax`;
};

const clearLocaleCookie = (): void => {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${LOCALE_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
};

export { clearLocaleCookie, readLocaleCookie, setLocaleCookie };

import { cookies, headers } from "next/headers";
import {
  type AppLocale,
  detectLocaleFromAcceptLanguage,
  resolveLocale,
} from "./index";

const getRequestLocale = async (): Promise<AppLocale> => {
  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get("locale")?.value;
    if (localeCookie) {
      return resolveLocale(localeCookie);
    }

    const headerStore = await headers();
    return detectLocaleFromAcceptLanguage(headerStore.get("accept-language"));
  } catch {
    return "en";
  }
};

export { getRequestLocale as default, getRequestLocale };

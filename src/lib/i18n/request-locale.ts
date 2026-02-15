import { cookies, headers } from "next/headers";
import {
  detectLocaleFromAcceptLanguage,
  resolveLocale,
  type AppLocale,
} from "./index";

export async function getRequestLocale(): Promise<AppLocale> {
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
}

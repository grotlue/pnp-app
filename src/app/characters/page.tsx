import CharactersPageView from "@/page-modules/characters-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function CharactersPage() {
  const locale = await getRequestLocale();
  return <CharactersPageView locale={locale} />;
}

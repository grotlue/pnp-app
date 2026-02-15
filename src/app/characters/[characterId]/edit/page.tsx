import { CharacterEditPageView } from "@/page-modules/character-edit-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

type Params = {
  params: Promise<{ characterId: string }>;
};

export default async function CharacterEditPage({ params }: Params) {
  const locale = await getRequestLocale();
  const { characterId } = await params;

  return <CharacterEditPageView locale={locale} characterId={characterId} />;
}

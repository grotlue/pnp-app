import { CharacterDetailPageView } from "@/page-modules/character-detail-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

type Params = {
  params: Promise<{ characterId: string }>;
};

export default async function CharacterDetailPage({ params }: Params) {
  const locale = await getRequestLocale();
  const { characterId } = await params;

  return <CharacterDetailPageView locale={locale} characterId={characterId} />;
}

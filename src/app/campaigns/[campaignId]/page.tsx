import { CampaignDetailPageView } from "@/page-modules/campaign-detail-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

type Params = {
  params: Promise<{ campaignId: string }>;
};

export default async function CampaignDetailPage({ params }: Params) {
  const locale = await getRequestLocale();
  const { campaignId } = await params;

  return <CampaignDetailPageView locale={locale} campaignId={campaignId} />;
}

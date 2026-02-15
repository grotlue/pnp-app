import { CampaignsPageView } from "@/page-modules/campaigns-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function CampaignsPage() {
  const locale = await getRequestLocale();
  return <CampaignsPageView locale={locale} />;
}

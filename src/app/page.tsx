import HomePageView from "@/page-modules/home-page";
import { isFeatureEnabled } from "@/lib/features/feature-flags";
import { getRequestLocale } from "@/lib/i18n/request-locale";

type HomePageProps = {
  searchParams: Promise<{ registered?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const locale = await getRequestLocale();
  const params = await searchParams;
  const registrationEnabled = await isFeatureEnabled("selfRegistration");

  return (
    <HomePageView
      locale={locale}
      registrationEnabled={registrationEnabled}
      registeredNotice={params.registered === "1"}
    />
  );
}

import { HomePageView } from "@/page-modules/home-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

type HomePageProps = {
  searchParams: Promise<{ registered?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const locale = await getRequestLocale();
  const params = await searchParams;

  return (
    <HomePageView
      locale={locale}
      registeredNotice={params.registered === "1"}
    />
  );
}

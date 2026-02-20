import { appRoutes } from "@/app/router";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import AdminMfaChallengePageView from "@/page-modules/admin-mfa-challenge-page";

type AdminMfaChallengePageProps = {
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function AdminMfaChallengePage({
  searchParams,
}: AdminMfaChallengePageProps) {
  const locale = await getRequestLocale();
  const params = await searchParams;

  return (
    <AdminMfaChallengePageView
      locale={locale}
      returnTo={params.returnTo ?? appRoutes.adminUsers}
    />
  );
}

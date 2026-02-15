import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/features/feature-flags";
import { RegisterPageView } from "@/page-modules/register-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function RegisterPage() {
  if (!isFeatureEnabled("selfRegistration")) {
    notFound();
  }

  const locale = await getRequestLocale();
  return <RegisterPageView locale={locale} />;
}

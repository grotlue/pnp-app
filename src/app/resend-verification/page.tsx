import { ResendVerificationPageView } from "@/page-modules/resend-verification-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function ResendVerificationPage() {
  const locale = await getRequestLocale();
  return <ResendVerificationPageView locale={locale} />;
}

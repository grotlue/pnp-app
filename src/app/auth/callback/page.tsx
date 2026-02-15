import { AuthCallbackPageView } from "@/page-modules/auth-callback-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function AuthCallbackPage() {
  const locale = await getRequestLocale();
  return <AuthCallbackPageView locale={locale} />;
}

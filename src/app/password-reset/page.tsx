import PasswordResetPageView from "@/page-modules/password-reset-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function PasswordResetPage() {
  const locale = await getRequestLocale();
  return <PasswordResetPageView locale={locale} />;
}

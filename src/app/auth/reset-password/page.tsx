import { AuthResetPasswordPageView } from "@/page-modules/auth-reset-password-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function AuthResetPasswordPage() {
  const locale = await getRequestLocale();
  return <AuthResetPasswordPageView locale={locale} />;
}

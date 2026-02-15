import { RegisterPageView } from "@/page-modules/register-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function RegisterPage() {
  const locale = await getRequestLocale();
  return <RegisterPageView locale={locale} />;
}

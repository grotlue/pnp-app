import { ProfilePageView } from "@/page-modules/profile-page";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export default async function ProfilePage() {
  const locale = await getRequestLocale();
  return <ProfilePageView locale={locale} />;
}

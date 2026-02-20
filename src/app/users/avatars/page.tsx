import { getRequestLocale } from "@/lib/i18n/request-locale";
import { UsersAvatarsPageView } from "@/page-modules/users-avatars-page";

export default async function UsersAvatarsPage() {
  const locale = await getRequestLocale();
  return <UsersAvatarsPageView locale={locale} />;
}

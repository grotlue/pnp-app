import type { ClientSession } from "@/lib/client/session";

export function isLoggedIn(session: ClientSession | null | undefined): boolean {
  return Boolean(session?.accessToken);
}

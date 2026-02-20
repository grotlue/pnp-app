import type { ClientSession } from "@/lib/client/session";

const isLoggedIn = (session: ClientSession | null | undefined): boolean => {
  return Boolean(session?.accessToken);
};

export { isLoggedIn as default, isLoggedIn };

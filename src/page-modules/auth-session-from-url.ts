type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
};

type AuthUrlParams = {
  code?: string;
  tokenHash?: string;
  type?: "signup" | "recovery" | "email" | "email_change";
};

const parseExpiresAt = (raw: string | null): number | undefined => {
  if (!raw) {
    return undefined;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
};

const getSessionTokensFromUrl = (
  windowLocation: Location,
): SessionTokens | null => {
  const hashRaw = windowLocation.hash.startsWith("#")
    ? windowLocation.hash.slice(1)
    : windowLocation.hash;
  const hash = new URLSearchParams(hashRaw);

  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    expiresAt: parseExpiresAt(hash.get("expires_at")),
  };
};

const getAuthParamsFromUrl = (windowLocation: Location): AuthUrlParams => {
  const search = new URLSearchParams(windowLocation.search);
  const type = search.get("type");

  return {
    code: search.get("code") ?? undefined,
    tokenHash: search.get("token_hash") ?? undefined,
    type:
      type === "signup" ||
      type === "recovery" ||
      type === "email" ||
      type === "email_change"
        ? type
        : undefined,
  };
};

export type { AuthUrlParams, SessionTokens };
export { getAuthParamsFromUrl, getSessionTokensFromUrl };

const ACCESS_COOKIE_NAME = "pnp_access_token";
const REFRESH_COOKIE_NAME = "pnp_refresh_token";

type CookieOptions = {
  maxAgeSeconds?: number;
};

const baseCookieParts = (): string[] => {
  return ["Path=/", "HttpOnly", "SameSite=Lax", "Secure"];
};

const serializeCookie = (
  name: string,
  value: string,
  options?: CookieOptions,
): string => {
  const parts = [`${name}=${encodeURIComponent(value)}`, ...baseCookieParts()];
  if (options?.maxAgeSeconds !== undefined) {
    parts.push(`Max-Age=${Math.max(0, Math.trunc(options.maxAgeSeconds))}`);
  }
  return parts.join("; ");
};

const setSessionCookies = (
  response: Response,
  input: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  },
) => {
  const headers = new Headers(response.headers);

  const nowSeconds = Math.floor(Date.now() / 1000);
  const accessMaxAge = input.expiresAt
    ? Math.max(0, input.expiresAt - nowSeconds)
    : undefined;

  headers.append(
    "Set-Cookie",
    serializeCookie(ACCESS_COOKIE_NAME, input.accessToken, {
      maxAgeSeconds: accessMaxAge,
    }),
  );

  if (input.refreshToken) {
    headers.append(
      "Set-Cookie",
      serializeCookie(REFRESH_COOKIE_NAME, input.refreshToken, {
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    );
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const clearSessionCookies = (response: Response) => {
  const headers = new Headers(response.headers);
  headers.append(
    "Set-Cookie",
    serializeCookie(ACCESS_COOKIE_NAME, "", { maxAgeSeconds: 0 }),
  );
  headers.append(
    "Set-Cookie",
    serializeCookie(REFRESH_COOKIE_NAME, "", { maxAgeSeconds: 0 }),
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const readAccessTokenFromCookies = (request: Request): string | null => {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(";").map((entry) => entry.trim());
  const match = parts.find((entry) =>
    entry.startsWith(`${ACCESS_COOKIE_NAME}=`),
  );
  if (!match) {
    return null;
  }

  const value = match.slice(ACCESS_COOKIE_NAME.length + 1);
  return value ? decodeURIComponent(value) : null;
};

export { clearSessionCookies, readAccessTokenFromCookies, setSessionCookies };

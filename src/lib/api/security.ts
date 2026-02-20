const DEFAULT_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
};

const parseAllowedOrigins = (): string[] => {
  const env = process.env.ALLOWED_ORIGINS;
  if (!env) {
    return [];
  }

  return env
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) {
    return false;
  }

  const allowed = parseAllowedOrigins();
  if (allowed.length === 0) {
    return true;
  }

  return allowed.includes(origin);
};

const resolveSafeRedirectUrl = (
  request: Request,
  path: string,
): string | undefined => {
  const headerOrigin = request.headers.get("origin");
  const requestOrigin = (() => {
    try {
      return new URL(request.url).origin;
    } catch {
      return null;
    }
  })();

  const originCandidates = [headerOrigin, requestOrigin].filter(
    (value): value is string => Boolean(value),
  );
  const origin = originCandidates.find((candidate) =>
    isAllowedOrigin(candidate),
  );
  if (!origin) {
    return undefined;
  }

  try {
    const url = new URL(path, origin);
    if (url.origin !== origin) {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
};

const withDefaultSecurityHeaders = (response: Response): Response => {
  const headers = new Headers(response.headers);
  Object.entries(DEFAULT_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const getClientIp = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
};

export {
  getClientIp,
  isAllowedOrigin,
  resolveSafeRedirectUrl,
  withDefaultSecurityHeaders,
};

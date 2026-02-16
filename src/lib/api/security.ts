const DEFAULT_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
};

function parseAllowedOrigins(): string[] {
  const env = process.env.ALLOWED_ORIGINS;
  if (!env) {
    return [];
  }

  return env
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) {
    return false;
  }

  const allowed = parseAllowedOrigins();
  if (allowed.length === 0) {
    return true;
  }

  return allowed.includes(origin);
}

export function resolveSafeRedirectUrl(
  request: Request,
  path: string,
): string | undefined {
  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return undefined;
  }

  if (!origin) {
    return undefined;
  }

  try {
    const url = new URL(path, origin);
    return url.toString();
  } catch {
    return undefined;
  }
}

export function withDefaultSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(DEFAULT_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

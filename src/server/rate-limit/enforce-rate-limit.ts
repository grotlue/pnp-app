import { jsonError } from "@/lib/api/http";
import { getClientIp } from "@/lib/api/security";
import { buildRateLimitKey } from "@/server/rate-limit/rate-limit-key";
import { checkRateLimit } from "@/server/rate-limit/check-rate-limit";

const enforceRateLimit = async (input: {
  request: Request;
  route: string;
  limit: number;
  windowMs: number;
  userId?: string | null;
}): Promise<Response | null> => {
  const key = buildRateLimitKey({
    route: input.route,
    ip: getClientIp(input.request),
    userId: input.userId,
  });

  const result = await checkRateLimit({
    key,
    limit: input.limit,
    windowMs: input.windowMs,
  });

  if (result.allowed) {
    return null;
  }

  const response = jsonError(429, "rate_limited", "Too many requests");
  response.headers.set(
    "Retry-After",
    String(Math.max(1, result.retryAfterSeconds)),
  );
  response.headers.set(
    "X-RateLimit-Remaining",
    String(Math.max(0, result.remaining)),
  );
  return response;
};

export { enforceRateLimit as default, enforceRateLimit };

import { createServiceRoleSupabaseClient } from "@/server/supabase/service-role-client";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const checkRateLimit = async (input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> => {
  try {
    const client = createServiceRoleSupabaseClient();
    const windowSeconds = Math.max(1, Math.ceil(input.windowMs / 1000));

    const { data, error } = await client.rpc("rpc_check_rate_limit", {
      p_key: input.key,
      p_limit: input.limit,
      p_window_seconds: windowSeconds,
    });

    if (error || !data || typeof data !== "object") {
      return {
        allowed: true,
        remaining: Number.POSITIVE_INFINITY,
        retryAfterSeconds: 0,
      };
    }

    const parsed = data as {
      allowed?: boolean;
      remaining?: number;
      retry_after_seconds?: number;
    };

    return {
      allowed: parsed.allowed !== false,
      remaining: parsed.remaining ?? 0,
      retryAfterSeconds: parsed.retry_after_seconds ?? 0,
    };
  } catch {
    return {
      allowed: true,
      remaining: Number.POSITIVE_INFINITY,
      retryAfterSeconds: 0,
    };
  }
};

export { checkRateLimit as default, checkRateLimit };
export type { RateLimitResult };

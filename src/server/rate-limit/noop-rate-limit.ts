type RateLimitInput = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
};

export async function checkRateLimit(
  input: RateLimitInput,
): Promise<RateLimitResult> {
  void input;
  return {
    allowed: true,
    remaining: Number.POSITIVE_INFINITY,
  };
}

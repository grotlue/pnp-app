type RateLimitInput = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
};

const checkRateLimit = async (
  input: RateLimitInput,
): Promise<RateLimitResult> => {
  void input;
  return {
    allowed: true,
    remaining: Number.POSITIVE_INFINITY,
  };
};

export { checkRateLimit as default, checkRateLimit };

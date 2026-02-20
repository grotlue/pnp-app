import { createHash } from "crypto";

const buildRateLimitKey = (input: {
  route: string;
  ip: string;
  userId?: string | null;
}): string => {
  const raw = `${input.route}:${input.userId ?? "anon"}:${input.ip}`;
  return createHash("sha256").update(raw).digest("hex");
};

export { buildRateLimitKey as default, buildRateLimitKey };

import { toSafeInt } from "@/lib/logic/collections";

const parseListLimitParam = (
  value: string | null,
  fallback = 100,
  min = 1,
  max = 500,
): number => {
  if (value === null) {
    return fallback;
  }

  return toSafeInt(value, fallback, min, max);
};

export { parseListLimitParam as default, parseListLimitParam };

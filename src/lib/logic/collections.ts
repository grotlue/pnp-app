const hasItems = <T>(items: T[] | null | undefined): items is T[] => {
  return Array.isArray(items) && items.length > 0;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const toSafeInt = (
  value: string | null | undefined,
  fallback: number,
  min: number,
  max: number,
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(parsed), min), max);
};

export { hasItems, isNonEmptyString, toSafeInt };

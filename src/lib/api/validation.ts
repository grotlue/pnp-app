import { isNonEmptyString } from "@/lib/logic/collections";

export function hasRequiredFields<
  T extends Record<string, unknown>,
  K extends keyof T,
>(body: T | null, requiredFields: K[]): body is T & { [P in K]-?: string } {
  if (!body) {
    return false;
  }

  return requiredFields.every((field) => isNonEmptyString(body[field]));
}

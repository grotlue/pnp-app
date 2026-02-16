import { describe, expect, it } from "vitest";
import { hasItems, isNonEmptyString, toSafeInt } from "../collections";

describe("collections", () => {
  it("hasItems checks for non-empty arrays", () => {
    expect(hasItems([1])).toBe(true);
    expect(hasItems([])).toBe(false);
    expect(hasItems(null)).toBe(false);
  });

  it("isNonEmptyString validates strings", () => {
    expect(isNonEmptyString("x")).toBe(true);
    expect(isNonEmptyString(" ")).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
  });

  it("toSafeInt clamps and falls back", () => {
    expect(toSafeInt("20", 1, 1, 10)).toBe(10);
    expect(toSafeInt("-1", 1, 1, 10)).toBe(1);
    expect(toSafeInt("abc", 3, 1, 10)).toBe(3);
  });
});

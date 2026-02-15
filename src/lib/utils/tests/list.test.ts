import { describe, expect, it } from "vitest";
import { clampListPage, paginateListItems } from "../list";

describe("list utils", () => {
  it("paginates items with 20 default page size", () => {
    const items = Array.from({ length: 45 }, (_, index) => index + 1);
    const pageTwo = paginateListItems(items, 2);
    expect(pageTwo).toHaveLength(20);
    expect(pageTwo[0]).toBe(21);
  });

  it("clamps out-of-bounds page values", () => {
    expect(clampListPage(0, 5, 2)).toBe(1);
    expect(clampListPage(9, 5, 2)).toBe(3);
  });
});

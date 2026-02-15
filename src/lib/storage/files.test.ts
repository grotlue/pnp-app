import { describe, expect, it } from "vitest";
import { isSquare, sanitizeFileName } from "@/lib/storage/files";

describe("storage file helpers", () => {
  it("validates square dimensions", () => {
    expect(isSquare(512, 512)).toBe(true);
    expect(isSquare(512, 256)).toBe(false);
    expect(isSquare(undefined, 256)).toBe(false);
  });

  it("sanitizes file names", () => {
    expect(sanitizeFileName("My Avatar!!.PNG")).toBe("my-avatar-.png");
  });
});

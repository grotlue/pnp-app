import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  normalizeTailLines,
  readLogTail,
  summarizeCommand,
} from "../log-utils.mjs";

describe("log-utils", () => {
  it("returns fallback when tail line input is invalid", () => {
    expect(normalizeTailLines(undefined, 30)).toBe(30);
    expect(normalizeTailLines("0", 30)).toBe(30);
    expect(normalizeTailLines("-5", 30)).toBe(30);
  });

  it("keeps valid positive integer tail line input", () => {
    expect(normalizeTailLines("50", 30)).toBe(50);
    expect(normalizeTailLines("12.7", 30)).toBe(12);
  });

  it("returns empty array for missing log file", () => {
    expect(readLogTail("/tmp/path-that-does-not-exist.log", 20)).toEqual([]);
  });

  it("reads only the requested tail lines", () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), "orchestrator-log-test-"));
    const filePath = path.join(tempDir, "output.log");

    try {
      writeFileSync(filePath, "line-1\nline-2\nline-3\nline-4\n", "utf8");
      expect(readLogTail(filePath, 2)).toEqual(["line-3", "line-4"]);
      expect(readLogTail(filePath, 10)).toEqual([
        "line-1",
        "line-2",
        "line-3",
        "line-4",
      ]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("summarizes long commands and keeps short commands unchanged", () => {
    expect(summarizeCommand("echo hello", 20)).toBe("echo hello");
    expect(summarizeCommand("echo 1 2 3 4 5 6 7 8 9 10", 18)).toBe(
      "echo 1 2 3 4 5...",
    );
  });
});

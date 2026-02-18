import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTO_SCRIPT = path.resolve(__dirname, "../../auto.mjs");
const SUPERVISOR_SCRIPT = path.resolve(__dirname, "../../supervisor.mjs");

function runHelp(scriptPath: string) {
  return spawnSync("node", [scriptPath, "--help"], {
    encoding: "utf8",
  });
}

describe("orchestrator CLI help", () => {
  it("includes verbose flag in auto help output", () => {
    const result = runHelp(AUTO_SCRIPT);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("--verbose");
  });

  it("includes verbose and tail-lines flags in supervisor help output", () => {
    const result = runHelp(SUPERVISOR_SCRIPT);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("--verbose");
    expect(result.stdout).toContain("--tail-lines <n>");
  });
});

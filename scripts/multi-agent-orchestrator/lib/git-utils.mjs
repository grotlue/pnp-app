import { spawnSync } from "node:child_process";

export function getWorkingTreeFiles(cwd) {
  const result = spawnSync("git", ["status", "--porcelain"], {
    cwd,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(`git status failed: ${result.stderr || "unknown error"}`);
  }

  return parsePorcelainOutput(result.stdout);
}

function parsePorcelainOutput(output) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("??")) {
        return line.slice(3).trim();
      }

      const rawPath = line.slice(3).trim();
      const renameSplit = rawPath.split(" -> ");
      return renameSplit[renameSplit.length - 1];
    });
}

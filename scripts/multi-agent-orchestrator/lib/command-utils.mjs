import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { spawn } from "node:child_process";

export function runShellCommand(command, options) {
  return new Promise((resolve) => {
    const start = Date.now();
    const child = spawn("/bin/zsh", ["-lc", command], {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...options.env,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      const durationMs = Date.now() - start;

      if (options.stdoutPath) {
        mkdirSync(dirname(options.stdoutPath), { recursive: true });
        writeFileSync(options.stdoutPath, stdout, "utf8");
      }

      if (options.stderrPath) {
        mkdirSync(dirname(options.stderrPath), { recursive: true });
        writeFileSync(options.stderrPath, stderr, "utf8");
      }

      resolve({
        command,
        exit_code: code ?? 1,
        duration_ms: durationMs,
        stdout_path: options.stdoutPath,
        stderr_path: options.stderrPath,
      });
    });
  });
}

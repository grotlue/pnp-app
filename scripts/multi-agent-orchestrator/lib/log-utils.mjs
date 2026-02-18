import { readFileSync } from "node:fs";

export function normalizeTailLines(value, fallback = 30) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function readLogTail(filePath, lineLimit = 30) {
  if (!filePath) {
    return [];
  }

  try {
    const raw = readFileSync(filePath, "utf8");
    const lines = raw.split(/\r?\n/);

    if (lines.at(-1) === "") {
      lines.pop();
    }

    if (lines.length === 0) {
      return [];
    }

    return lines.slice(-lineLimit);
  } catch {
    return [];
  }
}

export function summarizeCommand(command, maxLength = 140) {
  const normalized = String(command).replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

export function matchesAnyGlob(filePath, patterns) {
  if (!patterns || patterns.length === 0) {
    return true;
  }

  return patterns.some((pattern) =>
    globToRegExp(pattern).test(normalizePath(filePath)),
  );
}

function globToRegExp(pattern) {
  const normalized = normalizePath(pattern);
  const escaped = normalized
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "__DOUBLE_STAR__")
    .replace(/\*/g, "[^/]*")
    .replace(/__DOUBLE_STAR__/g, ".*")
    .replace(/\?/g, ".");

  return new RegExp(`^${escaped}$`);
}

function normalizePath(value) {
  return value.replaceAll("\\", "/").replace(/^\.\//, "");
}

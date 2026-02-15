export function sanitizeFileName(fileName: string): string {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

export function isSquare(width?: number, height?: number): boolean {
  if (!width || !height) {
    return false;
  }

  return width > 0 && width === height;
}

const sanitizeFileName = (fileName: string): string => {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
};

const isSquare = (width?: number, height?: number): boolean => {
  if (!width || !height) {
    return false;
  }

  return width > 0 && width === height;
};

export { isSquare, sanitizeFileName };

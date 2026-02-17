export const MAX_IMAGE_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

export function isWithinImageUploadSizeLimit(fileSize: unknown): boolean {
  if (typeof fileSize !== "number" || !Number.isFinite(fileSize)) {
    return false;
  }

  return fileSize > 0 && fileSize <= MAX_IMAGE_UPLOAD_SIZE_BYTES;
}

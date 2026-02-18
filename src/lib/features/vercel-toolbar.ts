export function resolveVercelToolbarEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_VERCEL_TOOLBAR === "true"
  );
}

export function buildContentSecurityPolicy(toolbarEnabled: boolean): string {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "https://challenges.cloudflare.com",
  ];
  const connectSrc = [
    "'self'",
    "https://*.supabase.co",
    "https://*.supabase.in",
    "wss://*.supabase.co",
    "https://challenges.cloudflare.com",
  ];
  const frameSrc = ["'self'", "https://challenges.cloudflare.com"];

  if (toolbarEnabled) {
    scriptSrc.push("https://vercel.live");
    connectSrc.push("https://vercel.live");
    frameSrc.push("https://vercel.live");
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    `frame-src ${frameSrc.join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

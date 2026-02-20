const SECURITY_ORIGINS = {
  cloudflareChallenges: "https://challenges.cloudflare.com",
  vercelLive: "https://vercel.live",
  supabaseCoHttpsWildcard: "https://*.supabase.co",
  supabaseInHttpsWildcard: "https://*.supabase.in",
  supabaseCoWssWildcard: "wss://*.supabase.co",
} as const;

const TURNSTILE_SCRIPT_ELEMENT_ID = "cloudflare-turnstile-script";
const TURNSTILE_EXPLICIT_RENDER_SCRIPT_URL = `${SECURITY_ORIGINS.cloudflareChallenges}/turnstile/v0/api.js?render=explicit`;

export {
  SECURITY_ORIGINS,
  TURNSTILE_EXPLICIT_RENDER_SCRIPT_URL,
  TURNSTILE_SCRIPT_ELEMENT_ID,
};

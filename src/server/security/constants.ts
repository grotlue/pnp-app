import { SECURITY_ORIGINS } from "@/lib/security/constants";

const CSP_KEYWORDS = {
  self: "'self'",
  unsafeInline: "'unsafe-inline'",
  none: "'none'",
} as const;

const CSP_SCRIPT_SRC_BASE = [
  CSP_KEYWORDS.self,
  CSP_KEYWORDS.unsafeInline,
  SECURITY_ORIGINS.cloudflareChallenges,
] as const;

const CSP_CONNECT_SRC_BASE = [
  CSP_KEYWORDS.self,
  SECURITY_ORIGINS.supabaseCoHttpsWildcard,
  SECURITY_ORIGINS.supabaseInHttpsWildcard,
  SECURITY_ORIGINS.supabaseCoWssWildcard,
  SECURITY_ORIGINS.cloudflareChallenges,
] as const;

const CSP_FRAME_SRC_BASE = [
  CSP_KEYWORDS.self,
  SECURITY_ORIGINS.cloudflareChallenges,
] as const;

const CSP_TOOLBAR_ORIGIN = SECURITY_ORIGINS.vercelLive;

const SECURITY_HEADERS = {
  contentSecurityPolicy: "Content-Security-Policy",
  referrerPolicy: "Referrer-Policy",
  contentTypeOptions: "X-Content-Type-Options",
  frameOptions: "X-Frame-Options",
  permissionsPolicy: "Permissions-Policy",
  cacheControl: "Cache-Control",
} as const;

const SECURITY_HEADER_VALUES = {
  defaultSrc: `${CSP_KEYWORDS.self}`,
  styleSrc: `${CSP_KEYWORDS.self} ${CSP_KEYWORDS.unsafeInline}`,
  imgSrc: `${CSP_KEYWORDS.self} data: blob: https:`,
  fontSrc: `${CSP_KEYWORDS.self} data:`,
  frameAncestors: CSP_KEYWORDS.none,
  baseUri: CSP_KEYWORDS.self,
  formAction: CSP_KEYWORDS.self,
  referrerPolicy: "strict-origin-when-cross-origin",
  contentTypeOptions: "nosniff",
  frameOptions: "DENY",
  permissionsPolicy: "camera=(), microphone=(), geolocation=()",
  noStore: "no-store",
} as const;

export {
  CSP_CONNECT_SRC_BASE,
  CSP_FRAME_SRC_BASE,
  CSP_KEYWORDS,
  CSP_SCRIPT_SRC_BASE,
  CSP_TOOLBAR_ORIGIN,
  SECURITY_HEADERS,
  SECURITY_HEADER_VALUES,
};

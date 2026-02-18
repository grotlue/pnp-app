import { SECURITY_ORIGINS } from "@/lib/security/constants";

export const CSP_KEYWORDS = {
  self: "'self'",
  unsafeInline: "'unsafe-inline'",
  none: "'none'",
} as const;

export const CSP_SCRIPT_SRC_BASE = [
  CSP_KEYWORDS.self,
  CSP_KEYWORDS.unsafeInline,
  SECURITY_ORIGINS.cloudflareChallenges,
] as const;

export const CSP_CONNECT_SRC_BASE = [
  CSP_KEYWORDS.self,
  SECURITY_ORIGINS.supabaseCoHttpsWildcard,
  SECURITY_ORIGINS.supabaseInHttpsWildcard,
  SECURITY_ORIGINS.supabaseCoWssWildcard,
  SECURITY_ORIGINS.cloudflareChallenges,
] as const;

export const CSP_FRAME_SRC_BASE = [
  CSP_KEYWORDS.self,
  SECURITY_ORIGINS.cloudflareChallenges,
] as const;

export const CSP_TOOLBAR_ORIGIN = SECURITY_ORIGINS.vercelLive;

export const SECURITY_HEADERS = {
  contentSecurityPolicy: "Content-Security-Policy",
  referrerPolicy: "Referrer-Policy",
  contentTypeOptions: "X-Content-Type-Options",
  frameOptions: "X-Frame-Options",
  permissionsPolicy: "Permissions-Policy",
  cacheControl: "Cache-Control",
} as const;

export const SECURITY_HEADER_VALUES = {
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

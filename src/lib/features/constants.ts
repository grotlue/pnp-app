export const NODE_ENV_VALUES = {
  development: "development",
  production: "production",
  test: "test",
} as const;

export const BOOLEAN_ENV_VALUES = {
  true: "true",
  false: "false",
} as const;

export const RUNTIME_ENVIRONMENTS = {
  development: "development",
  preview: "preview",
  production: "production",
} as const;

export const RUNTIME_ENVIRONMENT_LIST = [
  RUNTIME_ENVIRONMENTS.development,
  RUNTIME_ENVIRONMENTS.preview,
  RUNTIME_ENVIRONMENTS.production,
] as const;

export type RuntimeEnvironment = (typeof RUNTIME_ENVIRONMENT_LIST)[number];

export const PRODUCTION_RUNTIME_ENVIRONMENTS = new Set<RuntimeEnvironment>([
  RUNTIME_ENVIRONMENTS.preview,
  RUNTIME_ENVIRONMENTS.production,
]);

export const FEATURE_FLAG_PROVIDERS = {
  rules: "rules",
  vercel: "vercel",
} as const;

export const FEATURE_FLAG_PROVIDER_LIST = [
  FEATURE_FLAG_PROVIDERS.rules,
  FEATURE_FLAG_PROVIDERS.vercel,
] as const;

export type FeatureFlagProvider = (typeof FEATURE_FLAG_PROVIDER_LIST)[number];

export const AUTH_CAPTCHA_MODES = {
  off: "off",
  optional: "optional",
  required: "required",
} as const;

export const AUTH_CAPTCHA_MODE_LIST = [
  AUTH_CAPTCHA_MODES.off,
  AUTH_CAPTCHA_MODES.optional,
  AUTH_CAPTCHA_MODES.required,
] as const;

export type AuthCaptchaMode = (typeof AUTH_CAPTCHA_MODE_LIST)[number];

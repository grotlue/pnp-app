const NODE_ENV_VALUES = {
  development: "development",
  production: "production",
  test: "test",
} as const;

const BOOLEAN_ENV_VALUES = {
  true: "true",
  false: "false",
} as const;

const RUNTIME_ENVIRONMENTS = {
  development: "development",
  preview: "preview",
  production: "production",
} as const;

const RUNTIME_ENVIRONMENT_LIST = [
  RUNTIME_ENVIRONMENTS.development,
  RUNTIME_ENVIRONMENTS.preview,
  RUNTIME_ENVIRONMENTS.production,
] as const;

type RuntimeEnvironment = (typeof RUNTIME_ENVIRONMENT_LIST)[number];

const PRODUCTION_RUNTIME_ENVIRONMENTS = new Set<RuntimeEnvironment>([
  RUNTIME_ENVIRONMENTS.preview,
  RUNTIME_ENVIRONMENTS.production,
]);

const FEATURE_FLAG_PROVIDERS = {
  rules: "rules",
  vercel: "vercel",
} as const;

const FEATURE_FLAG_PROVIDER_LIST = [
  FEATURE_FLAG_PROVIDERS.rules,
  FEATURE_FLAG_PROVIDERS.vercel,
] as const;

type FeatureFlagProvider = (typeof FEATURE_FLAG_PROVIDER_LIST)[number];

const AUTH_CAPTCHA_MODES = {
  off: "off",
  optional: "optional",
  required: "required",
} as const;

const AUTH_CAPTCHA_MODE_LIST = [
  AUTH_CAPTCHA_MODES.off,
  AUTH_CAPTCHA_MODES.optional,
  AUTH_CAPTCHA_MODES.required,
] as const;

type AuthCaptchaMode = (typeof AUTH_CAPTCHA_MODE_LIST)[number];

export type { AuthCaptchaMode, FeatureFlagProvider, RuntimeEnvironment };
export {
  AUTH_CAPTCHA_MODES,
  AUTH_CAPTCHA_MODE_LIST,
  BOOLEAN_ENV_VALUES,
  FEATURE_FLAG_PROVIDERS,
  FEATURE_FLAG_PROVIDER_LIST,
  NODE_ENV_VALUES,
  PRODUCTION_RUNTIME_ENVIRONMENTS,
  RUNTIME_ENVIRONMENTS,
  RUNTIME_ENVIRONMENT_LIST,
};

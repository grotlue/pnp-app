const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_PASSWORD_LENGTH = 12;
const HAS_LOWERCASE = /[a-z]/;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_DIGIT = /\d/;
const TOTP_CODE_PATTERN = /^\d{6,8}$/;

const normalizeEmail = (value: string): string => {
  return value.trim().toLowerCase();
};

const isValidEmail = (value: string): boolean => {
  return EMAIL_PATTERN.test(value);
};

const normalizeAndValidateEmail = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = normalizeEmail(value);
  if (!normalized || !isValidEmail(normalized)) {
    return null;
  }

  return normalized;
};

const normalizeCaptchaToken = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeTotpCode = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, "");
  if (!TOTP_CODE_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
};

const validatePasswordStrength = (password: string): string | null => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  if (!HAS_LOWERCASE.test(password)) {
    return "password must include a lowercase letter";
  }

  if (!HAS_UPPERCASE.test(password)) {
    return "password must include an uppercase letter";
  }

  if (!HAS_DIGIT.test(password)) {
    return "password must include a number";
  }

  return null;
};

export {
  isValidEmail,
  normalizeAndValidateEmail,
  normalizeCaptchaToken,
  normalizeEmail,
  normalizeTotpCode,
  validatePasswordStrength,
};

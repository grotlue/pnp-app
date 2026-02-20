const DEFAULT_PUBLIC_MESSAGE = "Request failed";

const toPublicErrorMessage = (code: string, fallback?: string): string => {
  if (code === "invalid_payload") {
    return fallback ?? "Invalid request payload";
  }

  if (code === "auth_required") {
    return fallback ?? "Authorization bearer token is required.";
  }

  if (code === "invalid_token") {
    return fallback ?? "Access token is invalid or expired.";
  }

  if (code === "admin_required") {
    return fallback ?? "Admin access required";
  }

  if (code === "admin_mfa_required") {
    return fallback ?? "Admin MFA is required";
  }

  if (code === "not_found") {
    return fallback ?? "Not found";
  }

  if (code.endsWith("_required")) {
    return fallback ?? "Access denied";
  }

  if (code.endsWith("_failed")) {
    return fallback ?? DEFAULT_PUBLIC_MESSAGE;
  }

  return fallback ?? DEFAULT_PUBLIC_MESSAGE;
};

export { toPublicErrorMessage as default, toPublicErrorMessage };

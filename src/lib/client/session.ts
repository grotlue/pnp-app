export type ClientSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

const STORAGE_KEY = "pnp.session";
const SESSION_EVENT = "pnp-session-changed";

export function getSession(): ClientSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ClientSession;
    if (!parsed.accessToken) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function setSession(session: ClientSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function getSessionEventName() {
  return SESSION_EVENT;
}

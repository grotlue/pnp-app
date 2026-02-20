import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

type ClientSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

const STORAGE_KEY = "pnp.session";
const SESSION_EVENT = "pnp-session-changed";

const emitSessionChangedEvent = () => {
  window.dispatchEvent(new Event(SESSION_EVENT));
};

const applySupabaseSession = async (session: ClientSession) => {
  if (!session.refreshToken) {
    return;
  }

  try {
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.setSession({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
    });
  } catch {
    // Keep local fallback session as best-effort if Supabase sync is unavailable.
  }
};

const clearSupabaseSession = async () => {
  try {
    const supabase = getBrowserSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // Keep local cleanup behavior even if remote sign-out fails.
  }
};

const toExpiryMilliseconds = (expiresAt: number): number => {
  // Supabase returns epoch seconds for expires_at; keep ms-compatible input safe.
  return expiresAt > 10_000_000_000 ? expiresAt : expiresAt * 1000;
};

const getExpiryFromAccessToken = (accessToken: string): number | null => {
  const [, payload] = accessToken.split(".");
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = window.atob(padded);
    const parsed = JSON.parse(decoded) as { exp?: number };

    if (typeof parsed.exp !== "number" || !Number.isFinite(parsed.exp)) {
      return null;
    }

    return parsed.exp;
  } catch {
    return null;
  }
};

const isSessionExpired = (session: ClientSession): boolean => {
  const expiresAt =
    session.expiresAt ?? getExpiryFromAccessToken(session.accessToken);
  if (!expiresAt) {
    return false;
  }

  return toExpiryMilliseconds(expiresAt) <= Date.now();
};

const getSession = (): ClientSession | null => {
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

    if (isSessionExpired(parsed)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const setSession = (session: ClientSession) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  emitSessionChangedEvent();
  void applySupabaseSession(session);
};

const clearSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  emitSessionChangedEvent();
  void clearSupabaseSession();
};

const getSessionEventName = () => {
  return SESSION_EVENT;
};

export type { ClientSession };
export { clearSession, getSession, getSessionEventName, setSession };

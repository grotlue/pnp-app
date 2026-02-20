"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  type ClientSession,
  getSession,
  getSessionEventName,
} from "@/lib/client/session";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

const toClientSession = (session: Session | null): ClientSession | null => {
  if (!session) {
    return null;
  }

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
  };
};

const useClientSession = () => {
  const [session, setSessionState] = useState<ClientSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const sessionEventName = getSessionEventName();

    const syncLocalFallbackSession = () => {
      if (cancelled) {
        return;
      }
      setSessionState(getSession());
      setReady(true);
    };

    window.addEventListener(sessionEventName, syncLocalFallbackSession);

    const init = async () => {
      try {
        const supabase = getBrowserSupabaseClient();
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }

        if (!cancelled) {
          setSessionState(toClientSession(data.session) ?? getSession());
          setReady(true);
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (cancelled) {
            return;
          }
          setSessionState(toClientSession(nextSession) ?? getSession());
          setReady(true);
        });

        return () => {
          window.removeEventListener(
            sessionEventName,
            syncLocalFallbackSession,
          );
          subscription.unsubscribe();
        };
      } catch {
        if (!cancelled) {
          setSessionState(getSession());
          setReady(true);
        }
        return () => {
          window.removeEventListener(
            sessionEventName,
            syncLocalFallbackSession,
          );
        };
      }
    };

    let cleanup: (() => void) | undefined;
    void init().then((fn) => {
      cleanup = fn;
    });
    return () => {
      cancelled = true;
      cleanup?.();
      window.removeEventListener(sessionEventName, syncLocalFallbackSession);
    };
  }, []);

  return {
    session,
    setSession: setSessionState,
    ready,
  };
};

export default useClientSession;

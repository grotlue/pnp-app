"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { type ClientSession, getSession } from "@/lib/client/session";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

function toClientSession(session: Session | null): ClientSession | null {
  if (!session) {
    return null;
  }

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
  };
}

export function useClientSession() {
  const [session, setSessionState] = useState<ClientSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const supabase = getBrowserSupabaseClient();
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }

        if (!cancelled) {
          setSessionState(toClientSession(data.session));
          setReady(true);
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (cancelled) {
            return;
          }
          setSessionState(toClientSession(nextSession));
          setReady(true);
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch {
        if (!cancelled) {
          setSessionState(getSession());
          setReady(true);
        }
        return () => {};
      }
    }

    let cleanup: (() => void) | undefined;
    void init().then((fn) => {
      cleanup = fn;
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return {
    session,
    setSession: setSessionState,
    ready,
  };
}

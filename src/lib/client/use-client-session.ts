"use client";

import { useEffect, useState } from "react";
import {
  getSession,
  getSessionEventName,
  type ClientSession,
} from "@/lib/client/session";

export function useClientSession() {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const syncSession = () => {
      setSession(getSession());
      setReady(true);
    };

    const timeoutId = window.setTimeout(syncSession, 0);
    const sessionEvent = getSessionEventName();

    window.addEventListener(sessionEvent, syncSession);
    window.addEventListener("storage", syncSession);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(sessionEvent, syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  return {
    session,
    setSession,
    ready,
  };
}

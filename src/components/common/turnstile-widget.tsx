"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

type TurnstileWidgetProps = {
  siteKey: string;
  resetKey?: number;
  className?: string;
  loadErrorMessage?: string;
  onTokenChange: (token: string | null) => void;
};

type TurnstileInstance = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
  }
}

let turnstileScriptPromise: Promise<void> | null = null;
const TURNSTILE_SCRIPT_TIMEOUT_MS = 5_000;

function waitForExistingTurnstileScript(script: HTMLScriptElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve();
      return;
    }

    let settled = false;

    const onLoad = () => {
      if (window.turnstile) {
        finalize(() => resolve());
        return;
      }
      finalize(() => reject(new Error("turnstile_script_unavailable")));
    };

    const onError = () => {
      finalize(() => reject(new Error("turnstile_script_failed")));
    };

    const intervalId = window.setInterval(() => {
      if (window.turnstile) {
        finalize(() => resolve());
      }
    }, 100);

    const timeoutId = window.setTimeout(() => {
      finalize(() => reject(new Error("turnstile_script_timeout")));
    }, TURNSTILE_SCRIPT_TIMEOUT_MS);

    function finalize(callback: () => void) {
      if (settled) {
        return;
      }
      settled = true;
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
      callback();
    }

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
  });
}

function ensureTurnstileScript(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById("cloudflare-turnstile-script");
    if (existingScript) {
      void waitForExistingTurnstileScript(existingScript as HTMLScriptElement).then(resolve).catch(reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "cloudflare-turnstile-script";
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.turnstile) {
        resolve();
        return;
      }
      reject(new Error("turnstile_script_unavailable"));
    };
    script.onerror = () => reject(new Error("turnstile_script_failed"));
    document.head.appendChild(script);
  });

  turnstileScriptPromise = promise.catch((error) => {
    turnstileScriptPromise = null;
    throw error;
  });

  return turnstileScriptPromise;
}

export function TurnstileWidget({
  siteKey,
  resetKey = 0,
  className,
  loadErrorMessage,
  onTokenChange,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [failedResetKey, setFailedResetKey] = useState<number | null>(null);
  const loadError = failedResetKey === resetKey;

  useEffect(() => {
    let cancelled = false;

    onTokenChange(null);
    void ensureTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) {
          return;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onTokenChange(token),
          "expired-callback": () => onTokenChange(null),
          "error-callback": () => onTokenChange(null),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setFailedResetKey(resetKey);
          onTokenChange(null);
        }
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, resetKey, onTokenChange]);

  if (loadError) {
    return loadErrorMessage ? (
      <div className={cn("rounded-md border border-border bg-background p-2 text-xs", className)}>
        {loadErrorMessage}
      </div>
    ) : null;
  }

  return <div ref={containerRef} className={cn("min-h-16", className)} />;
}

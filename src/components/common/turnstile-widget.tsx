"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

type TurnstileWidgetProps = {
  siteKey: string;
  resetKey?: number;
  className?: string;
  loadErrorMessage?: string;
  onTokenChange: (token: string | null) => void;
  onErrorReason?: (reason: TurnstileErrorReason | null) => void;
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

export type TurnstileErrorReason =
  | "script_failed"
  | "script_timeout"
  | "script_unavailable"
  | "render_failed"
  | "widget_error";

let turnstileScriptPromise: Promise<void> | null = null;
const TURNSTILE_SCRIPT_TIMEOUT_MS = 12_000;

function mapTurnstileErrorReason(error: unknown): TurnstileErrorReason {
  if (!(error instanceof Error)) {
    return "script_failed";
  }

  if (error.message === "turnstile_script_timeout") {
    return "script_timeout";
  }
  if (error.message === "turnstile_script_unavailable") {
    return "script_unavailable";
  }
  return "script_failed";
}

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
  onErrorReason,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const onErrorReasonRef = useRef(onErrorReason);
  const [failedResetKey, setFailedResetKey] = useState<number | null>(null);
  const loadError = failedResetKey === resetKey;

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    onErrorReasonRef.current = onErrorReason;
  }, [onErrorReason]);

  useEffect(() => {
    let cancelled = false;

    onTokenChangeRef.current(null);
    onErrorReasonRef.current?.(null);
    void ensureTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) {
          return;
        }

        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token) => {
              onErrorReasonRef.current?.(null);
              onTokenChangeRef.current(token);
            },
            "expired-callback": () => onTokenChangeRef.current(null),
            "error-callback": () => {
              onErrorReasonRef.current?.("widget_error");
              onTokenChangeRef.current(null);
            },
          });
        } catch {
          setFailedResetKey(resetKey);
          onErrorReasonRef.current?.("render_failed");
          onTokenChangeRef.current(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setFailedResetKey(resetKey);
          onErrorReasonRef.current?.(mapTurnstileErrorReason(error));
          onTokenChangeRef.current(null);
        }
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, resetKey]);

  if (loadError) {
    return loadErrorMessage ? (
      <div className={cn("rounded-md border border-border bg-background p-2 text-xs", className)}>
        {loadErrorMessage}
      </div>
    ) : null;
  }

  return <div ref={containerRef} className={cn("min-h-16", className)} />;
}

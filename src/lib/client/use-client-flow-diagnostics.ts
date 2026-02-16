"use client";

import { useEffect, useRef } from "react";

function diagnosticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PERF_DIAGNOSTICS === "true";
}

function logClientDiagnostics(payload: Record<string, unknown>) {
  if (!diagnosticsEnabled()) {
    return;
  }

  console.info("client_perf_diagnostics", JSON.stringify(payload));
}

type UseClientFlowDiagnosticsInput = {
  flow: string;
  ready: boolean;
  loading: boolean;
  loaded: boolean;
};

export function useClientFlowDiagnostics(input: UseClientFlowDiagnosticsInput) {
  const mountStartedAt = useRef<number | null>(null);
  const readyLogged = useRef(false);
  const loadedLogged = useRef(false);
  const loadingStartedAt = useRef<number | null>(null);
  const loadingLogged = useRef(false);

  useEffect(() => {
    mountStartedAt.current = performance.now();
    logClientDiagnostics({
      flow: input.flow,
      event: "mount",
      atMs: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (readyLogged.current || !input.ready || mountStartedAt.current === null) {
      return;
    }

    readyLogged.current = true;
    logClientDiagnostics({
      flow: input.flow,
      event: "ready",
      atMs: Number((performance.now() - mountStartedAt.current).toFixed(2)),
    });
  }, [input.flow, input.ready]);

  useEffect(() => {
    if (input.loading && loadingStartedAt.current === null) {
      loadingStartedAt.current = performance.now();
      return;
    }

    if (!input.loading && loadingStartedAt.current !== null && !loadingLogged.current) {
      loadingLogged.current = true;
      const duration = performance.now() - loadingStartedAt.current;
      logClientDiagnostics({
        flow: input.flow,
        event: "loading_visible_duration",
        durationMs: Number(duration.toFixed(2)),
      });
    }
  }, [input.flow, input.loading]);

  useEffect(() => {
    if (loadedLogged.current || !input.loaded || mountStartedAt.current === null) {
      return;
    }

    loadedLogged.current = true;
    logClientDiagnostics({
      flow: input.flow,
      event: "loaded",
      atMs: Number((performance.now() - mountStartedAt.current).toFixed(2)),
    });
  }, [input.flow, input.loaded]);
}

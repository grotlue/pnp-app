import { performance } from "perf_hooks";

type DiagnosticSegment = {
  name: string;
  ms: number;
};

export type RequestDiagnostics = {
  enabled: boolean;
  requestId: string;
  route: string;
  method: string;
  path: string;
  region: string | null;
  startedAt: number;
  segments: DiagnosticSegment[];
};

function normalizeSegmentName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function resolveDiagnosticsEnabled(): boolean {
  const explicit = process.env.ENABLE_PERF_DIAGNOSTICS;
  if (explicit === "true") {
    return true;
  }

  if (explicit === "false") {
    return false;
  }

  return process.env.VERCEL_ENV === "preview";
}

function parseVercelRegionHeader(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const [region] = value.split("::");
  return region?.trim() || null;
}

export function createRequestDiagnostics(request: Request, route: string): RequestDiagnostics {
  const url = new URL(request.url);

  return {
    enabled: resolveDiagnosticsEnabled(),
    requestId: crypto.randomUUID(),
    route,
    method: request.method,
    path: url.pathname,
    region: parseVercelRegionHeader(request.headers.get("x-vercel-id")),
    startedAt: performance.now(),
    segments: [],
  };
}

export function addDiagnosticSegment(
  diagnostics: RequestDiagnostics | undefined,
  name: string,
  ms: number,
) {
  if (!diagnostics?.enabled) {
    return;
  }

  diagnostics.segments.push({
    name: normalizeSegmentName(name),
    ms,
  });
}

export async function measureDiagnostic<T>(
  diagnostics: RequestDiagnostics | undefined,
  name: string,
  fn: () => Promise<T> | PromiseLike<T>,
): Promise<T> {
  if (!diagnostics?.enabled) {
    return fn();
  }

  const started = performance.now();
  try {
    return await fn();
  } finally {
    addDiagnosticSegment(diagnostics, name, performance.now() - started);
  }
}

function buildServerTimingHeader(diagnostics: RequestDiagnostics, totalMs: number): string {
  const parts = diagnostics.segments.map(
    (segment) => `${segment.name};dur=${segment.ms.toFixed(1)}`,
  );
  parts.push(`handler.total;dur=${totalMs.toFixed(1)}`);
  return parts.join(", ");
}

function withHeaders(response: Response, headers: Headers): Response {
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function finalizeDiagnosticsResponse(
  diagnostics: RequestDiagnostics,
  response: Response,
): Response {
  if (!diagnostics.enabled) {
    return response;
  }

  const totalMs = performance.now() - diagnostics.startedAt;
  const headers = new Headers(response.headers);
  headers.set("X-Request-Id", diagnostics.requestId);
  headers.set("Server-Timing", buildServerTimingHeader(diagnostics, totalMs));
  if (diagnostics.region) {
    headers.set("X-Upstream-Region", diagnostics.region);
  }

  console.info(
    "perf_diagnostics",
    JSON.stringify({
      requestId: diagnostics.requestId,
      route: diagnostics.route,
      method: diagnostics.method,
      path: diagnostics.path,
      status: response.status,
      totalMs: Number(totalMs.toFixed(2)),
      region: diagnostics.region,
      segments: diagnostics.segments.map((segment) => ({
        ...segment,
        ms: Number(segment.ms.toFixed(2)),
      })),
    }),
  );

  return withHeaders(response, headers);
}

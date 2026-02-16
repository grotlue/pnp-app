import { clearSession, type ClientSession } from "@/lib/client/session";

export type ApiError = {
  code: string;
  message: string;
};

export type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
  status: number;
};

function diagnosticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PERF_DIAGNOSTICS === "true";
}

function logApiDiagnostics(payload: Record<string, unknown>) {
  if (!diagnosticsEnabled()) {
    return;
  }

  console.info("api_perf_diagnostics", JSON.stringify(payload));
}

export function unwrapApiResponse<T>(
  response: ApiResponse<T>,
  fallbackMessage = "Request failed",
): T {
  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? fallbackMessage);
  }
  return response.data;
}

export async function apiRequest<T>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    session?: ClientSession | null;
    body?: Record<string, unknown>;
  },
): Promise<ApiResponse<T>> {
  const method = options?.method ?? "GET";
  const startedAt = performance.now();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.session?.accessToken) {
    headers.Authorization = `Bearer ${options.session.accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      credentials: "same-origin",
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    const durationMs = Number((performance.now() - startedAt).toFixed(2));
    logApiDiagnostics({
      method,
      path,
      status: "network_error",
      durationMs,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  const durationMs = Number((performance.now() - startedAt).toFixed(2));
  logApiDiagnostics({
    method,
    path,
    status: response.status,
    durationMs,
    requestId: response.headers.get("x-request-id"),
    serverTiming: response.headers.get("server-timing"),
    upstreamRegion: response.headers.get("x-upstream-region"),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const err = payload as { error?: { code?: string; message?: string } } | null;
    const errorCode = err?.error?.code ?? "request_failed";
    const errorMessage = err?.error?.message ?? "Request failed";

    if (response.status === 401 && (errorCode === "invalid_token" || errorCode === "auth_required")) {
      clearSession();
    }

    return {
      data: null,
      error: {
        code: errorCode,
        message: errorMessage,
      },
      status: response.status,
    };
  }

  const wrapped = payload as { data?: T } | null;
  return {
    data: wrapped?.data ?? null,
    error: null,
    status: response.status,
  };
}

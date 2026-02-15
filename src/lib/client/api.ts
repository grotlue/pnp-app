import type { ClientSession } from "@/lib/client/session";

export type ApiError = {
  code: string;
  message: string;
};

export type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
  status: number;
};

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

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.session?.accessToken) {
    headers.Authorization = `Bearer ${options.session.accessToken}`;
  }

  const response = await fetch(path, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const err = payload as { error?: { code?: string; message?: string } } | null;
    return {
      data: null,
      error: {
        code: err?.error?.code ?? "request_failed",
        message: err?.error?.message ?? "Request failed",
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

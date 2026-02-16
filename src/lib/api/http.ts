import { toPublicErrorMessage } from "@/lib/api/errors";
import { withDefaultSecurityHeaders } from "@/lib/api/security";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export function jsonOk(data: unknown, status = 200): Response {
  return withDefaultSecurityHeaders(Response.json({ data }, { status }));
}

export function jsonError(
  status: number,
  code: string,
  message: string,
): Response {
  const body: ApiErrorBody = {
    error: { code, message: toPublicErrorMessage(code, message) },
  };

  return withDefaultSecurityHeaders(Response.json(body, { status }));
}

export async function parseJsonBody<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

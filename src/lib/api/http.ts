import { toPublicErrorMessage } from "@/lib/api/errors";
import { withDefaultSecurityHeaders } from "@/lib/api/security";

type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

const jsonOk = (data: unknown, status = 200): Response => {
  return withDefaultSecurityHeaders(Response.json({ data }, { status }));
};

const jsonError = (status: number, code: string, message: string): Response => {
  const body: ApiErrorBody = {
    error: { code, message: toPublicErrorMessage(code, message) },
  };

  return withDefaultSecurityHeaders(Response.json(body, { status }));
};

const parseJsonBody = async <T>(req: Request): Promise<T | null> => {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
};

export { jsonError, jsonOk, parseJsonBody, type ApiErrorBody };

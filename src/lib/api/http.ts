export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export function jsonOk(data: unknown, status = 200): Response {
  return Response.json({ data }, { status });
}

export function jsonError(
  status: number,
  code: string,
  message: string,
): Response {
  const body: ApiErrorBody = {
    error: { code, message },
  };

  return Response.json(body, { status });
}

export async function parseJsonBody<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

import type { User } from "@supabase/supabase-js";
import { jsonError } from "@/lib/api/http";
import {
  createServerSupabaseClient,
  createServerSupabaseUserClient,
} from "@/server/supabase/server-client";

export type AuthContext = {
  accessToken: string;
  user: User;
  client: ReturnType<typeof createServerSupabaseUserClient>;
};

function extractBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return null;
  }

  const [type, token] = authorization.split(" ");
  if (!type || !token || type.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
}

export async function requireAuth(
  request: Request,
): Promise<{ context: AuthContext } | { response: Response }> {
  const token = extractBearerToken(request);
  if (!token) {
    return {
      response: Response.json(
        {
          error: {
            code: "auth_required",
            message: "Authorization bearer token is required.",
          },
        },
        { status: 401 },
      ),
    };
  }

  try {
    const authClient = createServerSupabaseClient();
    const { data, error } = await authClient.auth.getUser(token);

    if (error || !data.user) {
      return {
        response: Response.json(
          {
            error: {
              code: "invalid_token",
              message: "Access token is invalid or expired.",
            },
          },
          { status: 401 },
        ),
      };
    }

    const client = createServerSupabaseUserClient(token);

    return {
      context: {
        accessToken: token,
        user: data.user,
        client,
      },
    };
  } catch (error) {
    return {
      response: jsonError(
        500,
        "auth_check_failed",
        error instanceof Error ? error.message : "Unexpected auth error",
      ),
    };
  }
}

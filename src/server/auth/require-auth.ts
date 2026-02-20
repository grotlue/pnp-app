import type { User } from "@supabase/supabase-js";
import { jsonError } from "@/lib/api/http";
import { readAccessTokenFromCookies } from "@/server/auth/session-cookie";
import {
  createServerSupabaseClient,
  createServerSupabaseUserAuthClient,
  createServerSupabaseUserClient,
} from "@/server/supabase/server-client";

type AuthContext = {
  accessToken: string;
  user: User;
  client: ReturnType<typeof createServerSupabaseUserClient>;
  authClient: ReturnType<typeof createServerSupabaseUserAuthClient>;
};

const extractBearerToken = (request: Request): string | null => {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return null;
  }

  const [type, token] = authorization.split(" ");
  if (!type || !token || type.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
};

const requireAuth = async (
  request: Request,
): Promise<{ context: AuthContext } | { response: Response }> => {
  const token =
    extractBearerToken(request) ?? readAccessTokenFromCookies(request);
  if (!token) {
    return {
      response: jsonError(
        401,
        "auth_required",
        "Authorization bearer token is required.",
      ),
    };
  }

  try {
    const authClient = createServerSupabaseClient();
    const { data, error } = await authClient.auth.getUser(token);

    if (error || !data.user) {
      return {
        response: jsonError(
          401,
          "invalid_token",
          "Access token is invalid or expired.",
        ),
      };
    }

    const client = createServerSupabaseUserClient(token);
    const authClientForUser = createServerSupabaseUserAuthClient(token);

    return {
      context: {
        accessToken: token,
        user: data.user,
        client,
        authClient: authClientForUser,
      },
    };
  } catch (error) {
    console.warn("requireAuth failed", error);
    return {
      response: jsonError(
        500,
        "auth_check_failed",
        "Authentication check failed",
      ),
    };
  }
};

export { requireAuth, type AuthContext };

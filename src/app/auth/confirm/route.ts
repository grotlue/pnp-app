import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function resolveSafeNextPath(input: string | null): string {
  if (!input || !input.startsWith("/") || input.startsWith("//")) {
    return "/";
  }

  return input;
}

function isSupportedOtpType(value: string | null): value is EmailOtpType {
  return (
    value === "signup" ||
    value === "recovery" ||
    value === "invite" ||
    value === "email" ||
    value === "email_change"
  );
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = resolveSafeNextPath(url.searchParams.get("next"));

  if (tokenHash && isSupportedOtpType(type)) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/auth/callback", url.origin));
}

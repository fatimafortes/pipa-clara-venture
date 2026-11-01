import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google sends the organizer back here (via Supabase) with a one-time code.
// We swap the code for a session cookie and continue to /app.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/app`);
    }
    console.error("[auth/callback] code exchange failed:", error.code, error.message);
  } else {
    // No code: Google or Supabase sent an error instead (e.g. account not in Test users)
    console.error("[auth/callback] no code:", searchParams.get("error"), searchParams.get("error_description"));
  }

  return NextResponse.redirect(`${origin}/login?error=1`);
}

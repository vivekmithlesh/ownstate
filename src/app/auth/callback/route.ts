// OwnState — OAuth / email-confirmation callback (Brick 04)
//
// Supabase (PKCE flow via @supabase/ssr) redirects here with a `?code=...` after
// the user confirms their email or completes Google sign-in. We exchange that
// code for a session (sets the auth cookies) and forward to `next`.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Respect the proxy/load-balancer host in production deployments.
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocal = process.env.NODE_ENV === "development";

      if (isLocal) return NextResponse.redirect(`${origin}${next}`);
      if (forwardedHost)
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth?message=${encodeURIComponent(
      "Sorry, we couldn't sign you in. The link may have expired — please try again."
    )}`
  );
}

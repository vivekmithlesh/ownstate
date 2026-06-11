import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every matched request and keeps the
 * auth cookies in sync between the browser and the server.
 *
 * Called from src/proxy.ts (Next.js 16 renamed `middleware` → `proxy`).
 *
 * Keeps the session fresh AND does an optimistic redirect of unauthenticated
 * users away from protected areas (Brick 04). Pages still call requireUser() as
 * the real gate — this is just a fast first line of defence.
 */

// Path prefixes that require a logged-in user.
const PROTECTED_PREFIXES = ["/dashboard", "/list-property", "/deal"];
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not run any code between createServerClient and getUser().
  // A simple mistake could make it very hard to debug intermittent logouts.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Optimistic gate: bounce signed-out users from protected areas to /auth.
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

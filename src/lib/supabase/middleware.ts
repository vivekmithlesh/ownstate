import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every matched request and keeps the
 * auth cookies in sync between the browser and the server.
 *
 * Called from src/proxy.ts (Next.js 16 renamed `middleware` → `proxy`).
 *
 * Route protection (redirecting unauthenticated users) is intentionally NOT done
 * here yet — that arrives with auth in Brick 04. For now this only keeps the
 * session fresh so Server Components see an up-to-date user.
 */
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
  await supabase.auth.getUser();

  return supabaseResponse;
}

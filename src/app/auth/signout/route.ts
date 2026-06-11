// OwnState — sign out (Brick 04)
//
// POST here (e.g. from the UserMenu form) to clear the Supabase session cookies
// and return to the home page. POST + 303 so the browser follows with a GET.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}

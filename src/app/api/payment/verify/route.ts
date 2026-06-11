// OwnState — Razorpay: verify a token payment (Brick 13)
//
// Server-only. We recompute the HMAC-SHA256 signature over
// `${order_id}|${payment_id}` with the secret key and compare it (constant-time)
// to the signature Razorpay returned. Only on a match do we mark the deal
// token_paid — the client can never set that status itself.

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";

import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export async function POST(request: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json(
      { error: "Payments aren't configured." },
      { status: 503 }
    );
  }

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    dealId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dealId } =
    body;
  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !dealId
  ) {
    return NextResponse.json({ error: "Missing payment fields." }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (!safeEqual(expected, razorpay_signature)) {
    return NextResponse.json(
      { error: "Payment verification failed." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: deal } = await supabase
    .from("deals")
    .select("id,buyer_id,status")
    .eq("id", dealId)
    .maybeSingle();
  if (!deal) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  }
  if (deal.buyer_id !== user.id) {
    return NextResponse.json({ error: "Not your deal." }, { status: 403 });
  }

  // Idempotent: if already paid, treat as success.
  if (deal.status === "interested") {
    const { error } = await supabase
      .from("deals")
      .update({ status: "token_paid", token_paid_at: new Date().toISOString() })
      .eq("id", dealId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  revalidatePath(`/deal/${dealId}`);
  return NextResponse.json({ ok: true });
}

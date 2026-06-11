// OwnState — Razorpay: create a booking-token order (Brick 13)
//
// Server-only. The secret key never leaves this route. We re-derive the token
// amount server-side (never trust a client amount), create a Razorpay order in
// TEST mode, persist the amount on the deal, and return the order to the client
// to open Checkout. RLS guarantees only the deal's buyer can reach the row.

import { NextResponse } from "next/server";
import Razorpay from "razorpay";

import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { computeTokenPaise } from "@/lib/utils";

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Payments aren't configured. Add Razorpay TEST keys to .env.local." },
      { status: 503 }
    );
  }

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  let dealId: string | undefined;
  try {
    ({ dealId } = await request.json());
  } catch {
    /* invalid body handled below */
  }
  if (!dealId) {
    return NextResponse.json({ error: "Missing dealId." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: deal } = await supabase
    .from("deals")
    .select("id,buyer_id,status,agreed_price,token_amount")
    .eq("id", dealId)
    .maybeSingle();

  if (!deal) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  }
  if (deal.buyer_id !== user.id) {
    return NextResponse.json(
      { error: "Only the buyer can pay the booking token." },
      { status: 403 }
    );
  }
  if (deal.status !== "interested") {
    return NextResponse.json(
      { error: "The booking token has already been paid." },
      { status: 409 }
    );
  }
  if (!deal.agreed_price) {
    return NextResponse.json(
      { error: "This deal has no agreed price yet." },
      { status: 400 }
    );
  }

  const amount = deal.token_amount ?? computeTokenPaise(deal.agreed_price);

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount, // paise
      currency: "INR",
      receipt: `deal_${dealId}`,
      notes: { dealId, buyerId: user.id },
    });

    // Persist the amount so the deal page and verify step agree.
    await supabase.from("deals").update({ token_amount: amount }).eq("id", dealId);

    return NextResponse.json({
      orderId: order.id,
      amount,
      currency: "INR",
      keyId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create order.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

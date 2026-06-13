// OwnState — Razorpay webhook (production payment reliability)
//
// WHY THIS EXISTS: the browser /verify call can be lost — the buyer pays, then
// closes the tab or loses network before verify runs. Without a webhook the
// money is taken but the deal never advances to token_paid. Razorpay also POSTs
// the event here, server-to-server, so the deal is reconciled regardless of the
// browser. Signature is verified over the RAW body with the webhook secret.
//
// SETUP (USER ACTION): Razorpay Dashboard → Settings → Webhooks → add
//   URL:    https://YOUR_DOMAIN/api/payment/webhook
//   Events: payment.captured, order.paid
//   Secret: set it, and put the same value in env as RAZORPAY_WEBHOOK_SECRET.

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { log, securityLog } from "@/lib/logger";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    // Misconfiguration, not a client error — log loudly, accept so Razorpay
    // doesn't retry forever against an unconfigured endpoint.
    log.error("payment.webhook.unconfigured");
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  // Verify the signature over the EXACT raw body (parsing first would break it).
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (!signature || !safeEqual(expected, signature)) {
    securityLog("payment.webhook.bad_signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { notes?: { dealId?: string }; order_id?: string } };
      order?: { entity?: { receipt?: string; notes?: { dealId?: string } } };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  // Recover the deal id from the notes we set in create-order, or the receipt.
  const dealId =
    event.payload?.payment?.entity?.notes?.dealId ??
    event.payload?.order?.entity?.notes?.dealId ??
    event.payload?.order?.entity?.receipt?.replace(/^deal_/, "");

  if (!dealId) {
    log.warn("payment.webhook.no_deal_id", { event: event.event });
    return NextResponse.json({ ok: true }); // ack so it isn't retried forever
  }

  const admin = createAdminClient();
  const { data: deal } = await admin
    .from("deals")
    .select("id,status")
    .eq("id", dealId)
    .maybeSingle();

  if (!deal) {
    log.warn("payment.webhook.deal_not_found", { dealId });
    return NextResponse.json({ ok: true });
  }

  // Idempotent: only the first successful event advances the deal.
  if (deal.status === "interested") {
    const { error } = await admin
      .from("deals")
      .update({ status: "token_paid", token_paid_at: new Date().toISOString() })
      .eq("id", dealId)
      .eq("status", "interested"); // guard against a concurrent /verify race
    if (error) {
      log.error("payment.webhook.update_failed", { dealId, error: error.message });
      return NextResponse.json({ error: "update failed" }, { status: 500 });
    }
    log.info("payment.webhook.token_paid", { dealId, event: event.event });
    revalidatePath(`/deal/${dealId}`);
  }

  return NextResponse.json({ ok: true });
}

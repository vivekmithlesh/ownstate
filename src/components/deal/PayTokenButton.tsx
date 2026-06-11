"use client";

// OwnState — Pay booking token via Razorpay Checkout (Brick 13)
//
// Flow: POST /api/payment/create-order → open Razorpay Checkout (TEST mode) with
// the PUBLIC key id → on success POST /api/payment/verify (server verifies the
// HMAC signature and flips the deal to token_paid) → toast + refresh.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}
interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (e: { error?: { description?: string } }) => void) => void;
}
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckout(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PayTokenButton({
  dealId,
  amount,
  propertyTitle,
  buyerName,
  buyerEmail,
  buyerPhone,
}: {
  dealId: string;
  amount: number;
  propertyTitle: string;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function pay() {
    setBusy(true);
    try {
      const ok = await loadCheckout();
      if (!ok || !window.Razorpay) {
        throw new Error("Couldn't load the payment gateway. Check your connection.");
      }

      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error ?? "Could not start payment.");

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "OwnState",
        description: `Booking token · ${propertyTitle}`,
        order_id: order.orderId,
        prefill: {
          name: buyerName ?? undefined,
          email: buyerEmail ?? undefined,
          contact: buyerPhone ?? undefined,
        },
        theme: { color: "#1D9E75" },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, dealId }),
            });
            const result = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(result.error ?? "Verification failed.");
            }
            toast.success("Booking token paid — deal advanced.");
            router.refresh();
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Payment verification failed."
            );
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });

      rzp.on("payment.failed", (e) => {
        toast.error(e.error?.description ?? "Payment failed.");
        setBusy(false);
      });

      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start payment.");
      setBusy(false);
    }
  }

  return (
    <Button size="lg" className="w-full" onClick={pay} disabled={busy}>
      {busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
      Pay booking token · {formatPrice(amount)}
    </Button>
  );
}

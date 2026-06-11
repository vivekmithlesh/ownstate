"use client";

// OwnState — Deal Room stage actions (Brick 13)
// Advance to the next lifecycle stage, or cancel. Either party may act; the
// server (advanceDeal) re-validates the transition. token_paid is reached only
// through PayTokenButton, so `interested` shows no forward button here.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { advanceDeal } from "@/lib/actions/deals";
import type { DealStatus } from "@/types/database";

const NEXT_LABEL: Partial<Record<DealStatus, { to: DealStatus; label: string }>> = {
  token_paid: { to: "agreement_signed", label: "Mark agreement signed" },
  agreement_signed: { to: "registered", label: "Mark registered" },
  registered: { to: "complete", label: "Mark deal complete" },
};

export function AdvanceDealButtons({
  dealId,
  status,
}: {
  dealId: string;
  status: DealStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<DealStatus | null>(null);

  if (status === "complete" || status === "cancelled") return null;

  const forward = NEXT_LABEL[status];

  async function go(to: DealStatus) {
    setBusy(to);
    try {
      await advanceDeal(dealId, to);
      toast.success(to === "cancelled" ? "Deal cancelled." : "Deal advanced.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update deal");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {forward && (
        <Button
          size="lg"
          className="w-full"
          onClick={() => go(forward.to)}
          disabled={busy !== null}
        >
          {busy === forward.to ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ArrowRight />
          )}
          {forward.label}
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-destructive hover:text-destructive"
        onClick={() => go("cancelled")}
        disabled={busy !== null}
      >
        {busy === "cancelled" ? <Loader2 className="animate-spin" /> : <X />}
        Cancel deal
      </Button>
    </div>
  );
}

import { describe, it, expect } from "vitest";
import {
  nextDealStatus,
  isDealParty,
  validateDealTransition,
} from "@/lib/deal-logic";

describe("nextDealStatus", () => {
  it("walks the forward path", () => {
    expect(nextDealStatus("interested")).toBe("token_paid");
    expect(nextDealStatus("token_paid")).toBe("agreement_signed");
    expect(nextDealStatus("agreement_signed")).toBe("registered");
    expect(nextDealStatus("registered")).toBe("complete");
  });
  it("returns null at the end of the path", () => {
    expect(nextDealStatus("complete")).toBeNull();
  });
  it("returns null for the off-path cancelled state", () => {
    expect(nextDealStatus("cancelled")).toBeNull();
  });
});

describe("isDealParty", () => {
  const deal = { buyer_id: "b1", seller_id: "s1" };
  it("recognises buyer and seller", () => {
    expect(isDealParty(deal, "b1")).toBe(true);
    expect(isDealParty(deal, "s1")).toBe(true);
  });
  it("rejects an outsider", () => {
    expect(isDealParty(deal, "x9")).toBe(false);
  });
});

describe("validateDealTransition", () => {
  it("allows each legal forward step (token_paid onward; pre-token is payment-gated)", () => {
    expect(validateDealTransition("token_paid", "agreement_signed").ok).toBe(
      true
    );
    expect(validateDealTransition("agreement_signed", "registered").ok).toBe(
      true
    );
    expect(validateDealTransition("registered", "complete").ok).toBe(true);
  });

  it("allows cancellation from any live stage", () => {
    expect(validateDealTransition("interested", "cancelled").ok).toBe(true);
    expect(validateDealTransition("agreement_signed", "cancelled").ok).toBe(
      true
    );
  });

  it("never lets advanceDeal reach token_paid from ANY stage (payment-only)", () => {
    // token_paid is set exclusively by the verified-payment flow, so advanceDeal
    // must reject it even though it is technically the next stage after interested.
    expect(validateDealTransition("interested", "token_paid").ok).toBe(false);
    expect(validateDealTransition("agreement_signed", "token_paid").ok).toBe(
      false
    );
    const r = validateDealTransition("interested", "token_paid");
    if (!r.ok) expect(r.error).toMatch(/payment step/i);
  });

  it("rejects skipping a stage", () => {
    const r = validateDealTransition("interested", "registered");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/next step/i);
  });

  it("rejects moving a terminal deal", () => {
    for (const term of ["complete", "cancelled"] as const) {
      const r = validateDealTransition(term, "registered");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/closed/i);
    }
  });

  it("rejects going backwards", () => {
    expect(validateDealTransition("registered", "token_paid").ok).toBe(false);
  });
});

// OwnState — pure deal-lifecycle logic (production-readiness: testability)
//
// Extracted from the advanceDeal server action so the rules can be unit-tested
// in isolation (no DB, no auth). The server action and the SQL `deal_advance`
// RPC both enforce the same rules; this is the single source of truth in TS.

import { DEAL_STAGES, type DealStatus } from "@/types/database";

/** Terminal states a deal can't move out of. */
export const TERMINAL_STATUSES: DealStatus[] = ["complete", "cancelled"];

/** The next forward stage after `current`, or null if there is none. */
export function nextDealStatus(current: DealStatus): DealStatus | null {
  const i = DEAL_STAGES.indexOf(current);
  if (i === -1) return null; // e.g. "cancelled" is not in the forward path
  return DEAL_STAGES[i + 1] ?? null;
}

/** Is `userId` the buyer or seller on this deal? */
export function isDealParty(
  deal: { buyer_id: string; seller_id: string },
  userId: string
): boolean {
  return deal.buyer_id === userId || deal.seller_id === userId;
}

export type TransitionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Validate a deal stage transition. Pure — same rules as the SQL guard.
 *  - terminal deals can't move
 *  - `cancelled` is allowed from any live stage
 *  - `token_paid` is never reachable here (only via the payment flow)
 *  - any other target must be the immediate next stage
 */
export function validateDealTransition(
  current: DealStatus,
  to: DealStatus
): TransitionResult {
  if (TERMINAL_STATUSES.includes(current)) {
    return { ok: false, error: "This deal is already closed." };
  }
  if (to === "cancelled") {
    return { ok: true };
  }
  if (to === "token_paid") {
    return { ok: false, error: "The token is paid through the payment step." };
  }
  if (nextDealStatus(current) !== to) {
    return { ok: false, error: "That stage isn't the next step." };
  }
  return { ok: true };
}

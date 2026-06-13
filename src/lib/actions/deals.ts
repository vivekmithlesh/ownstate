"use server";

// OwnState — Deals + Deal Room (Brick 09 start; Brick 13 full room)
//
// createDeal lets a buyer express interest from the property page. The Deal Room
// adds getDeal (buyer/seller only), advanceDeal (validated stage transitions),
// and real in-deal chat (sendMessage / getMessages). Token payment status is set
// server-side by the Razorpay verify route, never by the client.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { computeTokenPaise } from "@/lib/utils";
import { DEAL_STAGES } from "@/types/database";
import type { Deal, DealStatus, Message } from "@/types/database";

export interface CreateDealInput {
  propertyId: string;
}

/** A deal with the bits the Deal Room needs, party profiles, and the viewer's side. */
export interface DealParticipant {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}
export interface DealRoom {
  deal: Deal;
  property: {
    id: string;
    title: string;
    cover_image: string | null;
    locality: string | null;
    city: string | null;
    state: string | null;
    listing_type: Deal["deal_type"];
    type: string;
  };
  buyer: DealParticipant;
  seller: DealParticipant;
  /** Which side the current viewer is on. */
  viewer: "buyer" | "seller";
  /** Booking token in paise (stored value, or the deterministic default). */
  tokenAmount: number;
}

/**
 * Start (or resume) a deal between the current user and a property's owner.
 * Returns the deal id; the caller routes to /deal/[id].
 */
export async function createDeal(
  input: CreateDealInput
): Promise<{ id: string }> {
  const user = await getUser();
  if (!user) throw new Error("Please sign in to start a purchase.");

  const supabase = await createClient();

  const { data: property, error: propErr } = await supabase
    .from("properties")
    .select("owner_id, listing_type, price")
    .eq("id", input.propertyId)
    .single();
  if (propErr || !property) throw new Error("Property not found.");

  if (property.owner_id === user.id) {
    throw new Error("You can't start a deal on your own listing.");
  }

  // Resume an existing deal between this buyer and property if one exists.
  const { data: existing } = await supabase
    .from("deals")
    .select("id")
    .eq("property_id", input.propertyId)
    .eq("buyer_id", user.id)
    .maybeSingle();
  if (existing) return { id: existing.id as string };

  const { data, error } = await supabase
    .from("deals")
    .insert({
      property_id: input.propertyId,
      buyer_id: user.id,
      seller_id: property.owner_id,
      deal_type: property.listing_type,
      status: "interested",
      agreed_price: property.price,
    })
    .select("id")
    .single();
  if (error) throw new Error(`createDeal: ${error.message}`);

  revalidatePath("/dashboard");
  return { id: data.id as string };
}

/**
 * Load a single deal for its Deal Room. Buyer or seller only — RLS already
 * blocks others, but we also resolve the viewer's side and surface 404-style
 * `null` so the page can call notFound().
 */
export async function getDeal(id: string): Promise<DealRoom | null> {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: deal } = await supabase
    .from("deals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!deal) return null;

  const viewer =
    deal.buyer_id === user.id
      ? "buyer"
      : deal.seller_id === user.id
        ? "seller"
        : null;
  if (!viewer) return null;

  const [{ data: property }, { data: profiles }] = await Promise.all([
    supabase
      .from("properties")
      .select("id,title,cover_image,locality,city,state,listing_type,type")
      .eq("id", deal.property_id)
      .single(),
    supabase
      .from("profiles")
      .select("id,full_name,avatar_url")
      .in("id", [deal.buyer_id, deal.seller_id]),
  ]);
  if (!property) return null;

  const byId = new Map(
    (profiles ?? []).map((p) => [p.id, p as DealParticipant])
  );
  const blank = (uid: string): DealParticipant => ({
    id: uid,
    full_name: null,
    avatar_url: null,
  });

  const typedDeal = deal as Deal;
  return {
    deal: typedDeal,
    property: property as DealRoom["property"],
    buyer: byId.get(deal.buyer_id) ?? blank(deal.buyer_id),
    seller: byId.get(deal.seller_id) ?? blank(deal.seller_id),
    viewer,
    tokenAmount:
      typedDeal.token_amount ??
      (typedDeal.agreed_price ? computeTokenPaise(typedDeal.agreed_price) : 0),
  };
}

/**
 * Move a deal one stage forward, or cancel it. Only the buyer or seller may act.
 * Forward moves must be the immediate next stage; `token_paid` is reachable only
 * through the payment flow, never here. `complete`/`cancelled` are terminal.
 */
export async function advanceDeal(
  id: string,
  to: DealStatus
): Promise<{ status: DealStatus }> {
  const user = await getUser();
  if (!user) throw new Error("Please sign in.");

  const supabase = await createClient();
  const { data: deal } = await supabase
    .from("deals")
    .select("id,buyer_id,seller_id,status")
    .eq("id", id)
    .maybeSingle();
  if (!deal) throw new Error("Deal not found.");
  if (deal.buyer_id !== user.id && deal.seller_id !== user.id) {
    throw new Error("You are not part of this deal.");
  }

  const current = deal.status as DealStatus;
  if (current === "complete" || current === "cancelled") {
    throw new Error("This deal is already closed.");
  }

  if (to === "cancelled") {
    // allowed from any live stage
  } else if (to === "token_paid") {
    throw new Error("The token is paid through the payment step.");
  } else {
    const nextIndex = DEAL_STAGES.indexOf(current) + 1;
    if (DEAL_STAGES[nextIndex] !== to) {
      throw new Error("That stage isn't the next step.");
    }
  }

  // Perform the write through the guarded RPC. A direct table UPDATE of `status`
  // is blocked by the deals guard trigger (see supabase/security_hardening.sql);
  // deal_advance re-validates party + transition and lifts the guard for this tx.
  const { error } = await supabase.rpc("deal_advance", {
    p_deal_id: id,
    p_to: to,
  });
  if (error) throw new Error(`advanceDeal: ${error.message}`);

  revalidatePath(`/deal/${id}`);
  return { status: to };
}

/** All messages in a deal, oldest first. Buyer/seller only (RLS-enforced). */
export async function getMessages(dealId: string): Promise<Message[]> {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`getMessages: ${error.message}`);
  return (data ?? []) as Message[];
}

/** Post a chat message into a deal. RLS verifies the sender is a party. */
export async function sendMessage(
  dealId: string,
  body: string
): Promise<{ id: string }> {
  const user = await getUser();
  if (!user) throw new Error("Please sign in.");

  const text = body.trim();
  if (!text) throw new Error("Message can't be empty.");
  if (text.length > 2000) throw new Error("Message is too long.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ deal_id: dealId, sender_id: user.id, body: text })
    .select("id")
    .single();
  if (error) throw new Error(`sendMessage: ${error.message}`);

  revalidatePath(`/deal/${dealId}`);
  return { id: data.id as string };
}

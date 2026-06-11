"use server";

// OwnState — Deals (Brick 09: minimal start; Brick 13 adds the full Deal Room)
//
// createDeal lets a buyer express interest from the property page. The Deal Room
// (getDeal, advanceDeal, messages, Razorpay payments) is built in Brick 13.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

export interface CreateDealInput {
  propertyId: string;
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

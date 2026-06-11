"use server";

// OwnState — Enquiries (Brick 05)

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import type { Enquiry } from "@/types/database";

export interface CreateEnquiryInput {
  propertyId: string;
  name?: string | null;
  phone?: string | null;
  message?: string | null;
}

/** Send an enquiry about a property. Works for guests and logged-in users. */
export async function createEnquiry(
  input: CreateEnquiryInput
): Promise<{ id: string }> {
  const user = await getUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("enquiries")
    .insert({
      property_id: input.propertyId,
      from_user: user?.id ?? null,
      name: input.name ?? null,
      phone: input.phone ?? null,
      message: input.message ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`createEnquiry: ${error.message}`);

  revalidatePath("/dashboard/enquiries");
  return { id: data.id as string };
}

/** Enquiry shape joined with the basics of the property it concerns. */
export type EnquiryWithProperty = Enquiry & {
  property: { id: string; title: string; cover_image: string | null } | null;
};

/** Enquiries on every property the current user owns, newest first. */
export async function getEnquiriesForOwner(): Promise<EnquiryWithProperty[]> {
  const user = await getUser();
  if (!user) return [];

  const supabase = await createClient();
  // `!inner` join lets us filter enquiries by the property's owner_id.
  const { data, error } = await supabase
    .from("enquiries")
    .select(
      "*, property:properties!inner(id, title, cover_image, owner_id)"
    )
    .eq("property.owner_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`getEnquiriesForOwner: ${error.message}`);

  return (data ?? []).map((row) => {
    const { property, ...enquiry } = row as Enquiry & {
      property: {
        id: string;
        title: string;
        cover_image: string | null;
        owner_id: string;
      } | null;
    };
    return {
      ...enquiry,
      property: property
        ? {
            id: property.id,
            title: property.title,
            cover_image: property.cover_image,
          }
        : null,
    };
  });
}

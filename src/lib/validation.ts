// OwnState — server-side input validation (production-readiness audit)
//
// Zod schemas applied INSIDE the server actions, so they protect the database
// even when a client calls a server action / RPC directly (bypassing the form).
// Mirrors the client-side form rules but is the authoritative gate.

import { z } from "zod";

// Money is stored in paise. Cap at ₹100,000 Cr to reject absurd / overflow values.
const MAX_PAISE = 100_000 * 1_00_00_000 * 100;

export const propertyInputSchema = z.object({
  title: z.string().trim().min(5).max(150),
  description: z.string().trim().max(5000).nullish(),
  type: z.enum([
    "flat", "house", "land", "commercial", "villa",
    "penthouse", "mansion", "chateau", "island",
  ]),
  listing_type: z.enum(["sell", "rent", "lease"]),
  price: z.number().int().positive().max(MAX_PAISE),
  lat: z.number().min(-90).max(90).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
  area_sqft: z.number().positive().max(1_000_000_000).nullish(),
  area_unit: z.string().max(20).optional(),
  bedrooms: z.number().int().min(0).max(100).nullish(),
  bathrooms: z.number().int().min(0).max(100).nullish(),
  furnishing: z
    .enum(["unfurnished", "semi-furnished", "furnished", "none"])
    .nullish(),
  address: z.string().trim().max(300).nullish(),
  locality: z.string().trim().max(120).nullish(),
  city: z.string().trim().max(120).nullish(),
  state: z.string().trim().max(120).nullish(),
  country: z.string().trim().max(120).optional(),
  pincode: z.string().trim().max(20).nullish(),
  amenities: z.array(z.string().max(60)).max(50).optional(),
  rera_number: z.string().trim().max(60).nullish(),
  cover_image: z.string().url().max(2000).nullish(),
  images: z.array(z.string().url().max(2000)).max(40).optional(),
  documentUrls: z.array(z.string().max(500)).max(20).optional(),
});

export const enquiryInputSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().trim().max(120).nullish(),
  phone: z.string().trim().max(20).nullish(),
  message: z.string().trim().max(2000).nullish(),
});

export const boundaryInputSchema = z.object({
  landName: z.string().trim().min(1).max(150),
  geojson: z.string().min(2).max(200_000),
  khasraNumber: z.string().trim().max(60).nullish(),
  khataNumber: z.string().trim().max(60).nullish(),
  village: z.string().trim().max(120).nullish(),
  tehsil: z.string().trim().max(120).nullish(),
  district: z.string().trim().max(120).nullish(),
  state: z.string().trim().max(120).nullish(),
  ownershipType: z.string().trim().max(60).nullish(),
  notes: z.string().trim().max(2000).nullish(),
  documentUrls: z.array(z.string().max(500)).max(20).optional(),
});

export const uuidSchema = z.string().uuid();

/** Parse with a schema and throw a clean, user-safe error on failure. */
export function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown): T {
  const res = schema.safeParse(value);
  if (!res.success) {
    throw new Error("Invalid input. Please check the form and try again.");
  }
  return res.data;
}

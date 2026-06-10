// OwnState — shared domain types (Brick 02)
//
// These mirror supabase/schema.sql. PostGIS geography columns are surfaced to the
// app as plain shapes: a point becomes { lat, lng } and a polygon becomes an array
// of rings (each ring an array of [lng, lat] pairs, GeoJSON order). Server actions
// convert to/from PostGIS via RPC (added in Bricks 05 / 12).

export type UserRole = "buyer" | "seller" | "agent" | "admin";
export type KycStatus = "unverified" | "pending" | "verified" | "rejected";

export type PropertyType =
  | "flat"
  | "house"
  | "land"
  | "commercial"
  | "villa"
  | "penthouse"
  | "mansion"
  | "chateau"
  | "island";

export type ListingType = "sell" | "rent" | "lease";

export type PropertyStatus =
  | "active"
  | "pending_review"
  | "sold"
  | "rented"
  | "leased"
  | "inactive";

export type Furnishing =
  | "unfurnished"
  | "semi-furnished"
  | "furnished"
  | "none";

export type DealStatus =
  | "interested"
  | "token_paid"
  | "agreement_signed"
  | "registered"
  | "complete"
  | "cancelled";

/** A geographic point in WGS84 (SRID 4326). */
export interface LatLng {
  lat: number;
  lng: number;
}

/** Polygon as GeoJSON-style rings of [lng, lat] coordinates. */
export type PolygonCoords = [number, number][][];

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  kyc_status: KycStatus;
  avatar_url: string | null;
  created_at: string;
}

export interface Property {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  type: PropertyType;
  listing_type: ListingType;
  status: PropertyStatus;
  /** Stored in paise (₹1 = 100 paise). */
  price: number;
  area_sqft: number | null;
  area_unit: string;
  bedrooms: number | null;
  bathrooms: number | null;
  furnishing: Furnishing | null;
  address: string | null;
  locality: string | null;
  city: string | null;
  state: string | null;
  country: string;
  pincode: string | null;
  location: LatLng | null;
  amenities: string[];
  rera_number: string | null;
  verified: boolean;
  cover_image: string | null;
  images: string[];
  created_at: string;
  updated_at: string;
}

/** Property joined with its owner's profile (used on detail pages). */
export interface PropertyWithOwner extends Property {
  owner: Profile;
}

export interface LandBoundary {
  id: string;
  owner_id: string;
  property_id: string | null;
  land_name: string;
  khasra_number: string | null;
  khata_number: string | null;
  village: string | null;
  tehsil: string | null;
  district: string | null;
  state: string | null;
  boundary: PolygonCoords;
  area_acres: number | null;
  ownership_type: string | null;
  notes: string | null;
  document_urls: string[];
  verified: boolean;
  created_at: string;
}

export interface Deal {
  id: string;
  property_id: string;
  buyer_id: string;
  seller_id: string;
  deal_type: ListingType;
  status: DealStatus;
  agreed_price: number | null;
  token_amount: number | null;
  token_paid_at: string | null;
  created_at: string;
}

export interface SavedProperty {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
}

export interface Enquiry {
  id: string;
  property_id: string;
  from_user: string | null;
  name: string | null;
  phone: string | null;
  message: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  deal_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  type: string | null;
  filters: Record<string, unknown>;
  created_at: string;
}

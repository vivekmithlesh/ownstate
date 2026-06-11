// OwnState — shared constants (Brick 06)
//
// Plain data used across filters, forms and navigation. Keep label/value pairs
// here so the UI and the data layer agree on the exact strings the DB expects.

import type { ListingType, PropertyType } from "@/types/database";

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

/** The nine property types (value matches the DB check constraint). */
export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "flat", label: "Flat / Apartment" },
  { value: "house", label: "Independent House" },
  { value: "villa", label: "Villa" },
  { value: "penthouse", label: "Penthouse" },
  { value: "mansion", label: "Mansion" },
  { value: "chateau", label: "Chateau" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land / Plot" },
  { value: "island", label: "Island" },
];

export const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: "sell", label: "Buy" },
  { value: "rent", label: "Rent" },
  { value: "lease", label: "Lease" },
];

/** Luxury types featured under the "Luxury" nav entry. */
export const LUXURY_TYPES: PropertyType[] = [
  "villa",
  "penthouse",
  "mansion",
  "chateau",
  "island",
];

/** 30 major Indian cities for search filters & the listing wizard. */
export const CITIES: string[] = [
  "Mumbai",
  "Delhi",
  "New Delhi",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Noida",
  "Gurugram",
  "Chandigarh",
  "Goa",
  "Surat",
  "Indore",
  "Bhopal",
  "Nagpur",
  "Kochi",
  "Coimbatore",
  "Visakhapatnam",
  "Patna",
  "Bhubaneswar",
  "Dehradun",
  "Mysuru",
  "Guwahati",
  "Shimla",
  "Udaipur",
  "Andaman",
];

/** Indian states & union territories. */
export const STATES: string[] = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman & Nicobar Islands",
  "Chandigarh",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Puducherry",
];

/** Common amenities offered when listing / filtering. */
export const AMENITIES: string[] = [
  "Covered Parking",
  "Power Backup",
  "Lift",
  "24x7 Security",
  "Gym",
  "Swimming Pool",
  "Clubhouse",
  "Kids Play Area",
  "Garden",
  "Gated Community",
  "Piped Gas",
  "Sea View",
  "Private Terrace",
  "Servant Quarter",
  "EV Charging",
  "Solar Heater",
  "Borewell",
  "Wide Road",
  "Park Facing",
  "CCTV",
  "Pet Friendly",
  "Vastu Compliant",
];

export const FURNISHING_OPTIONS: Option[] = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi-furnished", label: "Semi-furnished" },
  { value: "furnished", label: "Furnished" },
];

/** Budget brackets (values in paise) for the search filter dropdowns. */
export interface BudgetBracket {
  label: string;
  value: number; // paise
}

const cr = (n: number) => n * 1_00_00_000 * 100;
const lakh = (n: number) => n * 1_00_000 * 100;
const k = (n: number) => n * 1_000 * 100;

export const BUY_BUDGETS: BudgetBracket[] = [
  { label: "₹25 L", value: lakh(25) },
  { label: "₹50 L", value: lakh(50) },
  { label: "₹1 Cr", value: cr(1) },
  { label: "₹2 Cr", value: cr(2) },
  { label: "₹5 Cr", value: cr(5) },
  { label: "₹10 Cr", value: cr(10) },
  { label: "₹25 Cr", value: cr(25) },
  { label: "₹50 Cr", value: cr(50) },
];

export const RENT_BUDGETS: BudgetBracket[] = [
  { label: "₹10,000", value: k(10) },
  { label: "₹25,000", value: k(25) },
  { label: "₹50,000", value: k(50) },
  { label: "₹1 L", value: lakh(1) },
  { label: "₹2 L", value: lakh(2) },
  { label: "₹5 L", value: lakh(5) },
];

export const BEDROOM_OPTIONS = [1, 2, 3, 4, 5];

import { describe, it, expect } from "vitest";
import {
  propertyInputSchema,
  enquiryInputSchema,
  boundaryInputSchema,
  uuidSchema,
  parseOrThrow,
} from "@/lib/validation";

const validProperty = {
  title: "Sea-facing 3BHK in Bandra West",
  type: "flat",
  listing_type: "sell",
  price: 720_000_000, // paise
  lat: 19.06,
  lng: 72.83,
};

describe("propertyInputSchema", () => {
  it("accepts a well-formed listing", () => {
    expect(propertyInputSchema.safeParse(validProperty).success).toBe(true);
  });

  it("rejects a negative price", () => {
    const r = propertyInputSchema.safeParse({ ...validProperty, price: -1 });
    expect(r.success).toBe(false);
  });

  it("rejects a zero / non-positive price", () => {
    expect(
      propertyInputSchema.safeParse({ ...validProperty, price: 0 }).success
    ).toBe(false);
  });

  it("rejects out-of-range coordinates", () => {
    expect(
      propertyInputSchema.safeParse({ ...validProperty, lat: 200 }).success
    ).toBe(false);
    expect(
      propertyInputSchema.safeParse({ ...validProperty, lng: -999 }).success
    ).toBe(false);
  });

  it("rejects an unknown property type (enum guard)", () => {
    expect(
      propertyInputSchema.safeParse({ ...validProperty, type: "spaceship" })
        .success
    ).toBe(false);
  });

  it("rejects a too-short title", () => {
    expect(
      propertyInputSchema.safeParse({ ...validProperty, title: "hi" }).success
    ).toBe(false);
  });

  it("rejects non-URL image entries", () => {
    expect(
      propertyInputSchema.safeParse({
        ...validProperty,
        images: ["not-a-url"],
      }).success
    ).toBe(false);
  });
});

describe("enquiryInputSchema", () => {
  it("accepts a valid enquiry", () => {
    const r = enquiryInputSchema.safeParse({
      propertyId: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
      name: "Asha",
      phone: "+919812345678",
      message: "Is this still available?",
    });
    expect(r.success).toBe(true);
  });
  it("rejects a non-uuid propertyId", () => {
    expect(
      enquiryInputSchema.safeParse({ propertyId: "123" }).success
    ).toBe(false);
  });
});

describe("boundaryInputSchema", () => {
  it("requires a land name and geojson", () => {
    expect(
      boundaryInputSchema.safeParse({ landName: "", geojson: "" }).success
    ).toBe(false);
    expect(
      boundaryInputSchema.safeParse({
        landName: "Ancestral field",
        geojson: '{"type":"Polygon","coordinates":[]}',
      }).success
    ).toBe(true);
  });
});

describe("uuidSchema", () => {
  it("accepts a uuid and rejects junk", () => {
    expect(uuidSchema.safeParse("3f2504e0-4f89-41d3-9a0c-0305e82c3301").success).toBe(
      true
    );
    expect(uuidSchema.safeParse("nope").success).toBe(false);
  });
});

describe("parseOrThrow", () => {
  it("returns parsed data on success", () => {
    const out = parseOrThrow(propertyInputSchema, validProperty);
    expect(out.title).toBe(validProperty.title);
  });
  it("throws a generic, user-safe error on failure", () => {
    expect(() => parseOrThrow(uuidSchema, "bad")).toThrowError(/invalid input/i);
  });
});

import { describe, it, expect } from "vitest";
import {
  formatPrice,
  computeTokenPaise,
  formatArea,
  getPropertyIcon,
  cn,
} from "@/lib/utils";

describe("formatPrice (input is paise)", () => {
  it("abbreviates crores", () => {
    // ₹1,00,00,000 = 10,000,000 rupees = 1,000,000,000 paise
    expect(formatPrice(1_000_000_000)).toBe("₹1 Cr");
  });

  it("abbreviates with decimals and trims trailing zeros", () => {
    // ₹2.5 Cr = 25,000,000 rupees = 2,500,000,000 paise
    expect(formatPrice(2_500_000_000)).toBe("₹2.5 Cr");
  });

  it("abbreviates lakhs", () => {
    // ₹72,00,000 = 7,200,000 rupees = 720,000,000 paise (72 lakh, under 1 Cr)
    expect(formatPrice(720_000_000)).toBe("₹72 L");
  });

  it("shows small amounts in full rupees", () => {
    // ₹50,000 = 5,000,000 paise
    expect(formatPrice(5_000_000)).toMatch(/^₹50,000$/);
  });

  it("formats rent/lease per-month and does not abbreviate", () => {
    // ₹55,000/mo = 5,500,000 paise
    expect(formatPrice(5_500_000, "rent")).toBe("₹55,000/mo");
    expect(formatPrice(5_500_000, "lease")).toBe("₹55,000/mo");
  });
});

describe("computeTokenPaise (1% clamped to ₹1,000–₹5,00,000)", () => {
  it("is 1% of price for mid-range values", () => {
    // ₹10,00,000 = 100,000,000 paise → 1% = ₹10,000 = 1,000,000 paise
    expect(computeTokenPaise(100_000_000)).toBe(1_000_000);
  });

  it("clamps up to the ₹1,000 floor for cheap listings", () => {
    // ₹50,000 = 5,000,000 paise → 1% = ₹500 → floored to ₹1,000 = 100,000 paise
    expect(computeTokenPaise(5_000_000)).toBe(100_000);
  });

  it("clamps down to the ₹5,00,000 ceiling for expensive listings", () => {
    // ₹100 Cr → 1% is huge → capped at ₹5,00,000 = 50,000,000 paise
    expect(computeTokenPaise(100_000_000_000)).toBe(50_000_000);
  });

  it("always returns a whole-rupee (÷100) amount", () => {
    for (const p of [5_000_001, 123_456_789, 999_999_999]) {
      expect(computeTokenPaise(p) % 100).toBe(0);
    }
  });
});

describe("formatArea", () => {
  it("returns null for null/undefined", () => {
    expect(formatArea(null)).toBeNull();
    expect(formatArea(undefined)).toBeNull();
  });
  it("labels sqft as 'sq ft'", () => {
    expect(formatArea(1450)).toBe("1,450 sq ft");
  });
  it("passes through other units verbatim", () => {
    expect(formatArea(2, "acres")).toBe("2 acres");
  });
});

describe("getPropertyIcon", () => {
  it("returns a component for every known type", () => {
    for (const t of ["flat", "house", "land", "island", "mansion"] as const) {
      expect(getPropertyIcon(t)).toBeTruthy();
    }
  });
  it("falls back for an unknown type without throwing", () => {
    // @ts-expect-error intentionally invalid
    expect(getPropertyIcon("spaceship")).toBeTruthy();
  });
});

describe("cn", () => {
  it("merges and de-duplicates conflicting tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe(
      "text-sm font-bold"
    );
  });
});

import { describe, it, expect } from "vitest";
import { parseCurrencyToCents, formatCentsToBRL } from "@/lib/currency";

describe("parseCurrencyToCents", () => {
  it("parses a Brazilian-formatted amount with thousands separator", () => {
    expect(parseCurrencyToCents("1.500,00")).toBe(150000);
  });

  it("parses a plain comma-decimal amount", () => {
    expect(parseCurrencyToCents("1500,00")).toBe(150000);
  });

  it("parses an integer with no decimals as whole reais", () => {
    expect(parseCurrencyToCents("1500")).toBe(150000);
  });

  it("rounds a single-digit decimal correctly", () => {
    expect(parseCurrencyToCents("10,5")).toBe(1050);
  });

  it("returns undefined for an empty string", () => {
    expect(parseCurrencyToCents("")).toBeUndefined();
  });

  it("returns undefined for a whitespace-only string", () => {
    expect(parseCurrencyToCents("   ")).toBeUndefined();
  });

  it("returns undefined for non-numeric input", () => {
    expect(parseCurrencyToCents("abc")).toBeUndefined();
  });
});

describe("formatCentsToBRL", () => {
  it("formats cents as a Brazilian real amount", () => {
    expect(formatCentsToBRL(150000)).toContain("1.500,00");
  });

  it("formats zero correctly", () => {
    expect(formatCentsToBRL(0)).toContain("0,00");
  });
});

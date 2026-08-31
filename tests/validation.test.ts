import { describe, it, expect } from "vitest";
import { contactInputSchema } from "@/lib/validation";

describe("contactInputSchema", () => {
  it("accepts a valid contact with only a name", () => {
    const result = contactInputSchema.safeParse({ name: "Maria Silva" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("lead");
  });

  it("rejects an empty name", () => {
    const result = contactInputSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = contactInputSchema.safeParse({ name: "Maria", email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid email", () => {
    const result = contactInputSchema.safeParse({ name: "Maria", email: "maria@example.com" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("maria@example.com");
  });

  it("treats an empty-string email as undefined", () => {
    const result = contactInputSchema.safeParse({ name: "Maria", email: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBeUndefined();
  });

  it("rejects an invalid status", () => {
    const result = contactInputSchema.safeParse({ name: "Maria", status: "customer" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid status", () => {
    const result = contactInputSchema.safeParse({ name: "Maria", status: "active" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("active");
  });
});

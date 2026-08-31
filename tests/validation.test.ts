import { describe, it, expect } from "vitest";
import { contactInputSchema, dealInputSchema } from "@/lib/validation";

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

  it("treats a whitespace-only email as undefined", () => {
    const result = contactInputSchema.safeParse({ name: "Maria", email: "   " });
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

describe("dealInputSchema", () => {
  const validContactId = "123e4567-e89b-12d3-a456-426614174000";

  it("accepts a valid deal with only title and contactId", () => {
    const result = dealInputSchema.safeParse({ title: "Contrato Acme", contactId: validContactId });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.stage).toBe("prospecting");
  });

  it("rejects an empty title", () => {
    const result = dealInputSchema.safeParse({ title: "   ", contactId: validContactId });
    expect(result.success).toBe(false);
  });

  it("rejects a missing/invalid contactId", () => {
    const result = dealInputSchema.safeParse({ title: "Contrato Acme", contactId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative value", () => {
    const result = dealInputSchema.safeParse({ title: "Contrato Acme", contactId: validContactId, value: -100 });
    expect(result.success).toBe(false);
  });

  it("accepts a valid non-negative integer value", () => {
    const result = dealInputSchema.safeParse({ title: "Contrato Acme", contactId: validContactId, value: 150000 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.value).toBe(150000);
  });

  it("rejects an invalid stage", () => {
    const result = dealInputSchema.safeParse({ title: "Contrato Acme", contactId: validContactId, stage: "closed" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid stage", () => {
    const result = dealInputSchema.safeParse({ title: "Contrato Acme", contactId: validContactId, stage: "won" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.stage).toBe("won");
  });

  it("treats an empty-string expectedCloseDate as undefined", () => {
    const result = dealInputSchema.safeParse({ title: "Contrato Acme", contactId: validContactId, expectedCloseDate: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.expectedCloseDate).toBeUndefined();
  });
});

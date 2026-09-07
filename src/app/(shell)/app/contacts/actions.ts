"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contact, leadFormToken } from "@/db/schema";
import { contactInputSchema, type ContactInput } from "@/lib/validation";
import { requireUserId } from "@/lib/session";

export async function listContacts() {
  const userId = await requireUserId();
  return db.select().from(contact).where(eq(contact.userId, userId)).orderBy(desc(contact.createdAt));
}

export async function createContact(input: ContactInput) {
  const userId = await requireUserId();
  const data = contactInputSchema.parse(input);
  await db.insert(contact).values({ userId, ...data });
  revalidatePath("/app/contacts");
  revalidatePath("/app"); // Dashboard aggregates contact counts by status
}

export async function updateContact(id: string, input: ContactInput) {
  const userId = await requireUserId();
  const data = contactInputSchema.parse(input);
  await db
    .update(contact)
    .set({
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      company: data.company ?? null,
      notes: data.notes ?? null,
      status: data.status,
      updatedAt: new Date(),
    })
    .where(and(eq(contact.id, id), eq(contact.userId, userId)));
  revalidatePath("/app/contacts");
  revalidatePath("/app"); // Dashboard aggregates contact counts by status
}

export async function deleteContact(id: string) {
  const userId = await requireUserId();
  await db.delete(contact).where(and(eq(contact.id, id), eq(contact.userId, userId)));
  revalidatePath("/app/contacts");
  revalidatePath("/app"); // Dashboard aggregates contact counts by status; deleting a contact also cascade-deletes its deals
}

export async function getOrCreateFormToken(): Promise<string> {
  const userId = await requireUserId();
  await db
    .insert(leadFormToken)
    .values({ userId, token: randomUUID() })
    .onConflictDoNothing({ target: leadFormToken.userId });
  const [row] = await db.select().from(leadFormToken).where(eq(leadFormToken.userId, userId));
  return row.token;
}

export async function regenerateFormToken(): Promise<string> {
  const userId = await requireUserId();
  const token = randomUUID();
  await db
    .insert(leadFormToken)
    .values({ userId, token })
    .onConflictDoUpdate({ target: leadFormToken.userId, set: { token } });
  revalidatePath("/app/contacts");
  return token;
}

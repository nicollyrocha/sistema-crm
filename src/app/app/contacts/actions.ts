"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { contact } from "@/db/schema";
import { contactInputSchema, type ContactInput } from "@/lib/validation";

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Não autenticado");
  return session.user.id;
}

export async function listContacts() {
  const userId = await requireUserId();
  return db.select().from(contact).where(eq(contact.userId, userId)).orderBy(desc(contact.createdAt));
}

export async function createContact(input: ContactInput) {
  const userId = await requireUserId();
  const data = contactInputSchema.parse(input);
  await db.insert(contact).values({ userId, ...data });
  revalidatePath("/app/contacts");
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
}

export async function deleteContact(id: string) {
  const userId = await requireUserId();
  await db.delete(contact).where(and(eq(contact.id, id), eq(contact.userId, userId)));
  revalidatePath("/app/contacts");
}

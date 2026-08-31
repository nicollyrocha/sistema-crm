"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { deal, contact } from "@/db/schema";
import { dealInputSchema, type DealInput } from "@/lib/validation";

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Não autenticado");
  return session.user.id;
}

async function requireOwnedContact(contactId: string, userId: string) {
  const rows = await db
    .select({ id: contact.id })
    .from(contact)
    .where(and(eq(contact.id, contactId), eq(contact.userId, userId)));
  if (rows.length === 0) throw new Error("Contato inválido");
}

export async function listDeals() {
  const userId = await requireUserId();
  return db
    .select({
      id: deal.id,
      title: deal.title,
      value: deal.value,
      expectedCloseDate: deal.expectedCloseDate,
      notes: deal.notes,
      stage: deal.stage,
      contactId: deal.contactId,
      contactName: contact.name,
    })
    .from(deal)
    .innerJoin(contact, eq(deal.contactId, contact.id))
    .where(eq(deal.userId, userId))
    .orderBy(desc(deal.createdAt));
}

export async function listContactsForPicker() {
  const userId = await requireUserId();
  return db
    .select({ id: contact.id, name: contact.name })
    .from(contact)
    .where(eq(contact.userId, userId))
    .orderBy(contact.name);
}

export async function createDeal(input: DealInput) {
  const userId = await requireUserId();
  const data = dealInputSchema.parse(input);
  await requireOwnedContact(data.contactId, userId);
  await db.insert(deal).values({ userId, ...data });
  revalidatePath("/app/deals");
}

export async function updateDeal(id: string, input: DealInput) {
  const userId = await requireUserId();
  const data = dealInputSchema.parse(input);
  await requireOwnedContact(data.contactId, userId);
  await db
    .update(deal)
    .set({
      title: data.title,
      contactId: data.contactId,
      value: data.value ?? null,
      expectedCloseDate: data.expectedCloseDate ?? null,
      notes: data.notes ?? null,
      stage: data.stage,
      updatedAt: new Date(),
    })
    .where(and(eq(deal.id, id), eq(deal.userId, userId)));
  revalidatePath("/app/deals");
}

export async function updateDealStage(id: string, stage: DealInput["stage"]) {
  const userId = await requireUserId();
  const parsedStage = dealInputSchema.shape.stage.parse(stage);
  await db
    .update(deal)
    .set({ stage: parsedStage, updatedAt: new Date() })
    .where(and(eq(deal.id, id), eq(deal.userId, userId)));
  revalidatePath("/app/deals");
}

export async function deleteDeal(id: string) {
  const userId = await requireUserId();
  await db.delete(deal).where(and(eq(deal.id, id), eq(deal.userId, userId)));
  revalidatePath("/app/deals");
}

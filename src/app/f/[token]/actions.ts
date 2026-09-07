"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contact, leadFormToken, leadFormSubmissionLog } from "@/db/schema";
import { leadFormInputSchema } from "@/lib/validation";
import { isRateLimited } from "@/lib/rate-limit";

export type LeadFormSubmission = {
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  website: string; // honeypot — must stay empty
};

export type SubmitLeadFormResult = { ok: true } | { ok: false; error: string };

export async function submitLeadForm(token: string, input: LeadFormSubmission): Promise<SubmitLeadFormResult> {
  const [tokenRow] = await db.select().from(leadFormToken).where(eq(leadFormToken.token, token));
  if (!tokenRow) {
    return { ok: false, error: "Formulário não encontrado." };
  }

  // Honeypot: a hidden field real visitors never fill in. Pretend success so
  // a bot doesn't learn it was caught, but create nothing.
  if (input.website.trim() !== "") {
    return { ok: true };
  }

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const recentSubmissions = await db
    .select({ submittedAt: leadFormSubmissionLog.submittedAt })
    .from(leadFormSubmissionLog)
    .where(eq(leadFormSubmissionLog.ip, ip))
    .orderBy(desc(leadFormSubmissionLog.submittedAt))
    .limit(20);

  if (isRateLimited(recentSubmissions.map((r) => r.submittedAt), new Date())) {
    return { ok: false, error: "Muitas tentativas, tente novamente mais tarde." };
  }

  // Log this attempt before validating, so repeated invalid submissions still
  // count toward the limit.
  await db.insert(leadFormSubmissionLog).values({ ip });

  const parsed = leadFormInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await db.insert(contact).values({ userId: tokenRow.userId, status: "lead", ...parsed.data });
  revalidatePath("/app/contacts");
  return { ok: true };
}

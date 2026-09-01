import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { contact, deal } from "@/db/schema";
import { DEAL_STAGES } from "@/lib/deal-stages";

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Não autenticado");
  return session.user.id;
}

export type ContactStats = {
  total: number;
  lead: number;
  active: number;
  inactive: number;
};

export async function getContactStats(): Promise<ContactStats> {
  const userId = await requireUserId();
  const rows = await db
    .select({
      status: contact.status,
      count: sql<number>`count(*)::int`,
    })
    .from(contact)
    .where(eq(contact.userId, userId))
    .groupBy(contact.status);

  const stats: ContactStats = { total: 0, lead: 0, active: 0, inactive: 0 };
  for (const row of rows) {
    if (row.status === "lead") stats.lead = row.count;
    else if (row.status === "active") stats.active = row.count;
    else if (row.status === "inactive") stats.inactive = row.count;
    stats.total += row.count;
  }
  return stats;
}

export type DealStageStat = { stage: string; count: number; value: number };

export type DealStats = {
  openCount: number;
  openValue: number;
  byStage: DealStageStat[];
};

export async function getDealStats(): Promise<DealStats> {
  const userId = await requireUserId();
  const rows = await db
    .select({
      stage: deal.stage,
      count: sql<number>`count(*)::int`,
      value: sql<number>`coalesce(sum(${deal.value}), 0)::int`,
    })
    .from(deal)
    .where(eq(deal.userId, userId))
    .groupBy(deal.stage);

  const byStage: DealStageStat[] = DEAL_STAGES.map((s) => {
    const found = rows.find((r) => r.stage === s.value);
    return { stage: s.value, count: found?.count ?? 0, value: found?.value ?? 0 };
  });

  let openCount = 0;
  let openValue = 0;
  for (const row of byStage) {
    if (row.stage !== "won" && row.stage !== "lost") {
      openCount += row.count;
      openValue += row.value;
    }
  }

  return { openCount, openValue, byStage };
}

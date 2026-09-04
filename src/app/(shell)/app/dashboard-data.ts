import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { contact, deal } from "@/db/schema";
import { CLOSED_STAGES, DEAL_STAGES } from "@/lib/deal-stages";
import { requireUserId } from "@/lib/session";

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
      // Cast to double precision, not ::int: sum() over many deals can exceed
      // Postgres's int4 range even though each individual deal.value fits.
      value: sql<number>`coalesce(sum(${deal.value}), 0)::double precision`,
    })
    .from(deal)
    .where(eq(deal.userId, userId))
    .groupBy(deal.stage);

  const byStage: DealStageStat[] = DEAL_STAGES.map((s) => {
    const found = rows.find((r) => r.stage === s.value);
    return { stage: s.value, count: found?.count ?? 0, value: found?.value ?? 0 };
  });

  // Computed from the raw grouped rows (not `byStage`) so a deal.stage value
  // outside DEAL_STAGES — there's no DB-level enum, only Zod at the app
  // boundary — still counts as open instead of silently vanishing from the
  // dashboard totals.
  let openCount = 0;
  let openValue = 0;
  for (const row of rows) {
    if (!CLOSED_STAGES.includes(row.stage as (typeof CLOSED_STAGES)[number])) {
      openCount += row.count;
      openValue += row.value;
    }
  }

  return { openCount, openValue, byStage };
}

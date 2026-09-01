# Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a summary Dashboard as the new `/app` landing page (contacts-by-status, open-deal totals, pipeline value by stage), moving the existing Contacts list to `/app/contacts` to make room.

**Architecture:** Two new read-only aggregation functions (`getContactStats`, `getDealStats`) query the existing `contact`/`deal` tables with `GROUP BY`/`COUNT`/`SUM` — no new table, no mutations. A new Server Component page at `/app` renders the results as stat-card grids, reusing the existing card visual idiom. The former `/app` (Contacts) page and its actions move to `/app/contacts` to free up the root path.

**Tech Stack:** Next.js 16 (Server Components only — no client interactivity needed for this feature), Drizzle ORM (`sql` template for aggregation), existing design system (no new UI primitives).

**Important — this plan touches the same `contact`/`deal` tables and reuses `DEAL_STAGES`/`formatCentsToBRL` from the Deals feature; it does not modify their schemas, validation, or server actions.**

**`.env.local` has a real, working `DATABASE_URL`** (same database as production) — verify against it for real.

---

## File Structure

```
sistema-crm/
  src/
    app/
      app/
        layout.tsx                 (modified: add "Contatos" nav link)
        page.tsx                   (replaced: was Contacts list, becomes Dashboard)
        dashboard-data.ts          (new: getContactStats / getDealStats)
        contacts/
          page.tsx                 (new: moved from src/app/app/page.tsx, content unchanged)
          actions.ts               (new: moved from src/app/app/actions.ts, content unchanged)
    components/
      dashboard/
        StatCard.tsx               (new)
      deals/
        DealBoard.tsx              (modified: zero-contacts link /app → /app/contacts)
```

---

### Task 1: Dashboard data aggregation functions

**Files:**
- Create: `src/app/app/dashboard-data.ts`

- [ ] **Step 1: Write the aggregation functions**

`src/app/app/dashboard-data.ts`:

```ts
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
```

Note: these are plain async functions, not `"use server"` Server Actions — they're only ever
called from a Server Component during render (Task 3's dashboard page), never invoked from a
client-side event handler, so they don't need the Server Action wrapper that `contacts/actions.ts`
and `deals/actions.ts` use for their mutations.

`byStage` always contains exactly 5 entries (one per `DEAL_STAGES` value, in that fixed order),
even for stages with zero deals — `count`/`value` default to `0` via `?? 0`, so the dashboard
never has to special-case a missing stage.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean, no errors.

- [ ] **Step 3: Manual verification against the real database**

Since these functions have no UI yet, verify them with a throwaway script run against the real
dev database:

```bash
node --experimental-strip-types -e "
import('./src/app/app/dashboard-data.ts').then(async (m) => {
  console.log('This direct import will fail outside Next.js runtime — see note below');
});
"
```

This will NOT work directly (the functions depend on `next/headers`, which requires the Next.js
request runtime) — instead, verify by temporarily calling both functions from the existing
`src/app/app/page.tsx` (Contacts page) with a `console.log`, loading `/app` in the browser via
`npm run dev`, and checking the server-side terminal output for the logged stats against contacts/
deals you know exist in your test account. Remove the temporary `console.log`/import before
committing — this task creates `dashboard-data.ts` only, it does not modify `page.tsx` (that
happens in Task 3).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add dashboard data aggregation functions"
```

---

### Task 2: Stat card component

**Files:**
- Create: `src/components/dashboard/StatCard.tsx`

- [ ] **Step 1: Write the component**

`src/components/dashboard/StatCard.tsx`:

```tsx
export function StatCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
}
```

This is a plain presentational component — no `"use client"`, no state, no hooks — it can be
rendered directly from a Server Component (Task 3's dashboard page) with no client-bundle cost.

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit` and `npm run lint`
Expected: both clean.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add StatCard component for dashboard"
```

---

### Task 3: Restructure navigation — move Contacts to `/app/contacts`, wire the Dashboard at `/app`

**Files:**
- Create: `src/app/app/contacts/page.tsx` (moved from `src/app/app/page.tsx`)
- Create: `src/app/app/contacts/actions.ts` (moved from `src/app/app/actions.ts`)
- Delete: `src/app/app/page.tsx` (old content — replaced by the new Dashboard page below)
- Delete: `src/app/app/actions.ts` (old location — moved)
- Modify: `src/app/app/layout.tsx`
- Modify: `src/components/deals/DealBoard.tsx`

This is one atomic task — do all the file moves and the new page creation together, so there's
never a moment where `/app` is broken or `/app/contacts` doesn't exist yet.

- [ ] **Step 1: Move the Contacts page and actions, unchanged, into `contacts/`**

```bash
mkdir -p src/app/app/contacts
git mv src/app/app/actions.ts src/app/app/contacts/actions.ts
```

For the page, since its content needs to change (it becomes the Dashboard at the old location),
copy it to the new location first, then overwrite the old location in Step 3:

```bash
git mv src/app/app/page.tsx src/app/app/contacts/page.tsx
```

Verify `src/app/app/contacts/page.tsx`'s import (`from "./actions"`) still resolves correctly —
it does, since `actions.ts` moved to the same `contacts/` folder alongside it, so the relative
import path (`./actions`) is unchanged. No edits needed inside either moved file.

- [ ] **Step 2: Update `src/app/app/layout.tsx` to add the "Contatos" nav link**

```tsx
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link href="/app" className="text-lg font-semibold">
          Sistema CRM
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/app/contacts" className="text-sm text-muted-foreground hover:text-foreground">
            Contatos
          </Link>
          <Link href="/app/deals" className="text-sm text-muted-foreground hover:text-foreground">
            Funil
          </Link>
          <Link href="/account" className="text-sm text-muted-foreground hover:text-foreground">
            Minha conta
          </Link>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Write the new Dashboard page at `src/app/app/page.tsx`**

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { StatCard } from "@/components/dashboard/StatCard";
import { DEAL_STAGES } from "@/lib/deal-stages";
import { formatCentsToBRL } from "@/lib/currency";
import { getContactStats, getDealStats } from "./dashboard-data";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login?session_expired=1");
  }

  const [contactStats, dealStats] = await Promise.all([getContactStats(), getDealStats()]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Contatos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total" value={String(contactStats.total)} />
          <StatCard label="Lead" value={String(contactStats.lead)} />
          <StatCard label="Ativo" value={String(contactStats.active)} />
          <StatCard label="Inativo" value={String(contactStats.inactive)} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Negociações em aberto</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard label="Negociações abertas" value={String(dealStats.openCount)} />
          <StatCard label="Valor em aberto" value={formatCentsToBRL(dealStats.openValue)} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Funil por estágio</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {dealStats.byStage.map((stat) => {
            const stageLabel = DEAL_STAGES.find((s) => s.value === stat.stage)?.label ?? stat.stage;
            return (
              <StatCard
                key={stat.stage}
                label={stageLabel}
                value={formatCentsToBRL(stat.value)}
                sublabel={`${stat.count} ${stat.count === 1 ? "negociação" : "negociações"}`}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Update `DealBoard.tsx`'s zero-contacts link**

In `src/components/deals/DealBoard.tsx`, change:

```tsx
          <Link href="/app" className="text-primary underline">
            Adicionar contato
          </Link>
```

to:

```tsx
          <Link href="/app/contacts" className="text-primary underline">
            Adicionar contato
          </Link>
```

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit` and `npm run lint`
Expected: both clean. (`npx tsc --noEmit` will also catch it if the `./actions` import in the
moved `contacts/page.tsx` broke, or if any other file still imports the old `@/app/app/actions`
path — grep for `from "@/app/app/actions"` or similar and fix any stragglers if the compiler
doesn't already surface them.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: move contacts to /app/contacts, add dashboard at /app"
```

---

### Task 4: Manual verification and responsive check

**Files:** none (verification only; fix any real issues found)

- [ ] **Step 1: Verify the full flow against the real database**

Run `npm run dev`. Log in with an existing test account (or sign up fresh and create a few
contacts with different statuses and a few deals across different stages via the UI first, so the
dashboard has real non-zero numbers to check).

1. Visit `/app` — confirm it now shows the Dashboard (not the old Contacts list): "Contatos"
   section with Total/Lead/Ativo/Inativo counts matching what you created, "Negociações em
   aberto" section with a count and `R$` value excluding Ganho/Perdido deals, "Funil por estágio"
   section with all 5 stages listed (even ones with 0 deals), each showing a value and a
   "N negociação(ões)" sublabel with correct singular/plural.
2. Confirm the nav now shows "Contatos", "Funil", "Minha conta" (in that order) next to the
   "Sistema CRM" logo.
3. Click "Contatos" — confirm it navigates to `/app/contacts` and shows the full contacts list
   (search, filters, create/edit/delete) working exactly as it did before this plan, at the new URL.
4. Click "Funil" — confirm `/app/deals` still works as before.
5. On a fresh throwaway account with zero contacts, visit `/app/deals` and confirm the
   zero-contacts prompt's "Adicionar contato" link goes to `/app/contacts` (not `/app`, and not a
   404).
6. Add one more contact and one more deal, then reload `/app` — confirm the dashboard numbers
   update to reflect the new totals (proves the aggregation queries read live data, not a cached
   snapshot).

- [ ] **Step 2: Check responsive layout at 375px, 768px, and 1280px**

Visit `/app` at each width.
Expected: at 375px, each stat-card grid collapses to a single column (`sm:grid-cols-*` only
applies at `sm` and above) with no horizontal page scroll; at 768px, the Contatos grid shows 2
columns and the Funil grid shows 2 columns; at 1280px, Contatos shows 4 columns and Funil shows
5 columns (all on one row), matching the `lg:grid-cols-4`/`lg:grid-cols-5` classes.

- [ ] **Step 3: Fix any issues found**

Fix specific Tailwind classes if something breaks. Re-check at all three widths.

- [ ] **Step 4: Commit (only if fixes were made)**

```bash
git add -A
git commit -m "fix: responsive layout issues in dashboard"
```

---

### Task 5: Deploy

**Files:** none

- [ ] **Step 1: Verify the production build**

```bash
npm run build
```

Expected: succeeds with no type errors.

- [ ] **Step 2: Push to trigger the Vercel deployment**

```bash
git push origin master
```

Expected: pushes cleanly; Vercel auto-deploys. No production migration step is needed — this
feature adds no new tables/columns.

- [ ] **Step 3: Verify in production**

Once the deployment is live, visit **https://sistema-crm-alpha.vercel.app**: log in, confirm
`/app` now shows the Dashboard with correct numbers, confirm `/app/contacts` still has the full
contacts feature, confirm the nav order (Contatos / Funil / Minha conta), confirm `/app/deals`'s
zero-contacts link (if applicable) points at `/app/contacts`.

---

## Self-Review Notes

- **Spec coverage**: navigation restructuring (Task 3), contact-status aggregation and
  open-deal/by-stage aggregation (Task 1), stat-card UI matching the existing design language
  (Task 2-3), the `DealBoard` link fix called out explicitly in the spec (Task 3 Step 4),
  responsive check (Task 4), deploy (Task 5) — all covered.
- **Type consistency**: `ContactStats`/`DealStats`/`DealStageStat` types defined in Task 1 are
  used unchanged by the Dashboard page in Task 3 — no drift. `DEAL_STAGES` (from the existing
  `src/lib/deal-stages.ts`) and `formatCentsToBRL` (from the existing `src/lib/currency.ts`) are
  imported, not redefined, avoiding any duplicate-source-of-truth risk for stage labels or money
  formatting.
- **No placeholders**: all steps contain complete, runnable code or exact commands. Task 1's
  Step 3 manual-verification note explains why a standalone script won't work (Next.js request
  runtime dependency) and gives a concrete alternative instead of leaving it vague.

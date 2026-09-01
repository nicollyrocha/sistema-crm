# Dashboard — Design Spec

Date: 2026-08-31

## Purpose

Third CRM domain feature, on top of the harness, Contacts (`2026-08-31-contacts-design.md`), and
the Sales Pipeline (`2026-08-31-deals-pipeline-design.md`). Gives the user a summary view — total
contacts by status, open-deal count/value, and pipeline value by stage — as soon as they log in,
tying Contacts and Deals together instead of leaving them as two disconnected screens.

## Navigation restructuring

Today `/app` **is** the Contacts list. This spec promotes the Dashboard to be the landing page:

| Route           | Before        | After                                    |
|------------------|---------------|-------------------------------------------|
| `/app`           | Contacts list | **Dashboard** (new)                        |
| `/app/contacts`  | (didn't exist)| Contacts list (moved from `/app`)          |
| `/app/deals`     | Sales pipeline| unchanged                                   |

Rationale: a dashboard is conventionally the first thing a CRM user sees; putting it at the bare
`/app` root (rather than a deeper path) matches how `/app/deals` already reads ("the app, deals
view") and reserves the shortest URL for the page most people land on most often.

The `/app/layout.tsx` nav becomes: **Sistema CRM** (logo, still links to `/app`) — **Contatos**
(new link, `/app/contacts`) — **Funil** (unchanged, `/app/deals`) — **Minha conta** — **Sair**.

Any existing hardcoded link to `/app` that means "go to the contacts list" must be updated to
`/app/contacts` — concretely, `DealBoard.tsx`'s zero-contacts guard ("Você precisa ter pelo menos
um contato... Adicionar contato") currently links to `/app` and must become `/app/contacts`.

No changes are needed to `src/proxy.ts`: its `PROTECTED_ROUTES` check (`pathname.startsWith
("/app")`) and `matcher` (`/app/:path*`) already cover both `/app` and `/app/contacts`.

## Data

No new table. The dashboard reads existing `contact` and `deal` rows (both already scoped to
`userId`) and aggregates them at request time:

- **Contacts by status**: count of the user's contacts grouped by `status` (`lead`/`active`/
  `inactive`), plus the total.
- **Open deals**: count and summed `value` (cents) of deals whose `stage` is NOT `won` or `lost`.
- **Value by stage**: summed `value` (cents) and count of deals, grouped by `stage`, across all
  5 stages (including `won`/`lost`, so the dashboard shows the full picture, not just the open
  pipeline).

All three are answerable with `COUNT`/`SUM` + `GROUP BY` queries via Drizzle — no aggregation
table, no caching layer; this project's data volumes (a single user's personal contact/deal
lists) don't warrant it, consistent with the YAGNI stance taken in both prior specs.

A deal with a `null` value contributes to the count for its stage/status but `0` to the summed
value (i.e., `SUM` naturally ignores `NULL`s in Postgres — no special-casing needed, but worth
being explicit so a future reader doesn't wonder whether `null` values are silently excluded from
the count too, which they are not).

## Routes / Pages

| Route  | Auth | Purpose                                                                  |
|--------|------|-----------------------------------------------------------------------------|
| `/app` | yes  | **New**: Dashboard — summary cards for contacts and deals                  |

## Features

A single, read-only page — no forms, no mutations. Three groups of stat cards, in this order:

1. **Contatos**: one card per status (Lead / Ativo / Inativo) showing the count, plus a "Total"
   figure. Clicking a card is out of scope (no drill-down/filtering from the dashboard itself in
   this iteration — the existing `/app/contacts` status filter already covers that).
2. **Negociações em aberto**: one card showing count + summed value of non-`won`/`lost` deals.
3. **Funil por estágio**: one card per stage (Prospecção/Proposta/Negociação/Ganho/Perdido)
   showing count + summed value for that stage — visually similar to the Kanban column headers
   on `/app/deals`, but as static numbers rather than an interactive board.

Empty states (zero contacts and/or zero deals) show `0`/`R$ 0,00` in the relevant cards rather
than a special "no data yet" message — simpler, and still informative, unlike a list view where
an empty list genuinely has nothing useful to show.

## Server Actions / Data Fetching

`src/app/app/dashboard-data.ts` (new file — **not** `actions.ts`, since nothing here is a
mutation; naming it distinctly signals "read-only aggregation" to a future reader, unlike the
`actions.ts` files used by Contacts/Deals which are all mutations plus one read each):

- `getContactStats()` — returns `{ lead: number, active: number, inactive: number, total: number
  }`, scoped to the session user.
- `getDealStats()` — returns `{ openCount: number, openValue: number, byStage: { stage: string,
  count: number, value: number }[] }`, scoped to the session user.

Both are plain async server-only functions (not `"use server"` Server Actions, since they're only
ever called from a Server Component during render, never invoked from client-side event
handlers) — a distinction worth being explicit about, since every prior feature's data-fetching
function (`listContacts`, `listDeals`) WAS a `"use server"` export for consistency with the
mutations living alongside them in the same file. Here, isolating pure reads in their own
non-`"use server"` module is a deliberate, small deviation, justified by there being no mutations
in this feature to co-locate with.

## Design Language

Reuses the existing design system: same dark teal/emerald palette, same `Card`-style
`rounded-xl border border-border bg-card p-4` idiom already used throughout Contacts/Deals for
list items — applied here to stat tiles instead. No new primitives needed.

## Error Handling

Same session-guard pattern as `/app/contacts` and `/app/deals`: redirect to
`/login?session_expired=1` if there's no valid session. No user-facing error states beyond that —
the aggregation queries have no user input to validate (no forms), so the only failure mode is an
unreachable database, which surfaces as Next.js's generic error boundary, consistent with how
every other Server Component page in this app already handles that class of failure (none of them
wrap their data fetch in a try/catch either).

## Out of Scope (for this feature)

- Charts/graphs (bar charts, funnel visualizations) — plain numeric stat cards only for now
- Date-range filtering ("this month", "this quarter")
- Drill-down/click-through from a stat card into a filtered list view
- Real-time updates (the page reflects data as of the last load/navigation, same as every other
  page in this app)

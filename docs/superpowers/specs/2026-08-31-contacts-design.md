# Contacts — Design Spec

Date: 2026-08-31

## Purpose

First real CRM domain feature on top of the harness built in
`2026-08-30-sistema-crm-harness-design.md`. Lets a logged-in user manage their own list of
contacts (leads/customers): create, view, search, filter by status, edit, and delete. This
replaces the placeholder `/app` dashboard with the actual product.

## Data Model

New application-owned table, alongside Better Auth's existing tables in the same Drizzle schema
(`src/db/schema.ts`):

```
contact
  id          uuid, primary key, default random
  userId      text, references user.id, onDelete cascade
  name        text, not null
  email       text, nullable
  phone       text, nullable
  company     text, nullable
  notes       text, nullable
  status      text, not null, default 'lead'   -- 'lead' | 'active' | 'inactive'
  createdAt   timestamp, not null, default now
  updatedAt   timestamp, not null, default now
```

`status` is stored as plain text with the three known values enforced at the application layer
(Zod), not a Postgres enum — keeps a future 4th status a pure code change, no migration.

## Routes / Pages

| Route  | Auth | Purpose                                                              |
|--------|------|-----------------------------------------------------------------------|
| `/app` | yes  | **Changes from placeholder to the contacts dashboard**: list, search, filter, create, edit, delete contacts, scoped to the logged-in user |

No new routes. `/app`'s layout (nav, sign-out, link to `/account`) is unchanged.

## Features

- **List**: all of the current user's contacts, newest first.
- **Create**: inline form at the top of the list (name required; email/phone/company/notes
  optional; status defaults to `lead`).
- **Edit**: same form, in place of the contact's row, pre-filled — mirrors the existing
  `TaskForm`/`TaskItem` edit-in-place pattern from the sibling `todo-list` project.
- **Delete**: with an inline confirm step (no modal), same pattern as `todo-list`.
- **Search**: client-side, filters the already-loaded list by name/email/company as the user
  types (no server round-trip — consistent with `todo-list`'s `SearchBar`).
- **Status filter**: a simple select/tab control (`Todos` / `Lead` / `Ativo` / `Inativo`) next to
  the search bar, combined with the text search (both filters apply together).

## Validation

Zod schema (`src/lib/validation.ts`, new file — no such file exists yet in this project):

```ts
contactInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().optional().or(z.literal("")).transform(v => v || undefined),
  phone: z.string().trim().max(30).optional().or(z.literal("")).transform(v => v || undefined),
  company: z.string().trim().max(200).optional().or(z.literal("")).transform(v => v || undefined),
  notes: z.string().trim().max(2000).optional().or(z.literal("")).transform(v => v || undefined),
  status: z.enum(["lead", "active", "inactive"]).default("lead"),
})
```

Applied both client-side (before calling the server action, for instant feedback) and
server-side (inside each server action, as the actual authority) — this is the one place in the
project where Zod earns its place, since these are app-owned mutations with no framework-level
validation backing them (unlike the auth forms, which Better Auth validates internally).

## Server Actions

`src/app/app/actions.ts` (new file): `listContacts`, `createContact`, `updateContact`,
`deleteContact` — each requires a session (`auth.api.getSession`) and scopes all queries/mutations
to `eq(contact.userId, session.user.id)`, mirroring `todo-list`'s task actions exactly.

## Design Language

Reuses the existing design system as-is — same dark teal/emerald palette, same `Card`/`Button`/
`Input`/`Label` primitives, same `rounded-xl border border-border bg-card p-4` list-item idiom
already used elsewhere in the app. No new visual identity work needed; this is a feature build on
an already-finished design system.

## Error Handling

- Zod validation errors surface inline under the relevant field (client-side check before submit).
- Server action failures (e.g. a lost session mid-edit) surface as a small inline error message
  in the form, consistent with the auth forms' pattern.

## Out of Scope (for this feature)

- Deals/pipeline, activity timeline, tags, custom fields, imports/exports, bulk actions
- Server-side search/pagination (fine to load the full list client-side at this stage; revisit if
  a real user's contact count makes that impractical)
- Any relationship between contacts and other future entities

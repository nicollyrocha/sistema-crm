# Sales Pipeline (Deals) — Design Spec

Date: 2026-08-31

## Purpose

Second CRM domain feature on top of the harness and the Contacts feature
(`2026-08-31-contacts-design.md`). Lets a logged-in user track sales opportunities ("deals")
through a 5-stage pipeline, each deal tied to one of their existing contacts. Adds a Kanban-style
board (no drag-and-drop — stage changes via a per-card control) at a new route, `/app/deals`.

## Data Model

New application-owned table, alongside `contact` in the same Drizzle schema (`src/db/schema.ts`):

```
deal
  id                  uuid, primary key, default random
  userId              text, references user.id, onDelete cascade
  contactId           uuid, references contact.id, onDelete cascade, not null
  title               text, not null
  value               integer, nullable          -- stored in cents (BRL), e.g. 150000 = R$ 1.500,00
  expectedCloseDate   date, nullable
  notes               text, nullable
  stage               text, not null, default 'prospecting'
                      -- 'prospecting' | 'proposal' | 'negotiation' | 'won' | 'lost'
  createdAt           timestamp, not null, default now
  updatedAt           timestamp, not null, default now
```

- `value` is stored as an integer number of cents (not a float) to avoid rounding errors —
  standard practice for money. The UI accepts/displays reais (`R$ 1.500,00`) and converts.
- `contactId` cascades on delete: deleting a contact deletes their deals too. This mirrors the
  existing `user → contact` cascade and keeps the data model simple; it does mean deleting a
  contact silently removes their deal history, which is an explicit, accepted trade-off for this
  stage (no soft-delete/archival in scope).
- `stage` is free text with the five values enforced by Zod at the application layer, same
  pattern as `contact.status` — keeps adding/renaming a stage a pure code change.

## Routes / Pages

| Route        | Auth | Purpose                                                                |
|--------------|------|--------------------------------------------------------------------------|
| `/app/deals` | yes  | Kanban board: 5 stage columns, create/edit/delete deals, change stage    |

`/app/layout.tsx`'s nav gains a "Funil" link next to "Minha conta". `/app` itself is unchanged
(still the Contacts dashboard).

## Features

- **Board view**: one column per stage (`Prospecção`, `Proposta`, `Negociação`, `Ganho`,
  `Perdido`), each showing its deals as cards (title, linked contact's name, formatted value,
  expected close date if set).
- **Create**: a form (title required, contact required — a `<select>` of the user's existing
  contacts, value/expected-close-date/notes optional, stage defaults to `prospecting`). If the
  user has zero contacts yet, the create form is replaced with a prompt to add a contact first
  (via a link to `/app`), since a deal cannot exist without one.
- **Change stage**: each card has a `<select>` listing all 5 stages; picking a different one
  moves the card to that column immediately (no drag-and-drop).
- **Edit**: opens the same create-form fields pre-filled, in place of the card (mirrors the
  edit-in-place pattern from `ContactItem`).
- **Delete**: inline confirm step, same pattern as contacts.
- No search/filter across the whole board in this iteration — 5 columns is navigable without
  one; revisit if a column grows large.

## Validation

Zod schema, added to the existing `src/lib/validation.ts` (alongside `contactInputSchema`):

```ts
export const dealInputSchema = z.object({
  title: z.string().trim().min(1, "O título é obrigatório").max(200, "Título muito longo"),
  contactId: z.string().uuid("Selecione um contato"),
  value: z
    .number()
    .int()
    .nonnegative("O valor não pode ser negativo")
    .optional(),
  expectedCloseDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  notes: z
    .string()
    .trim()
    .max(2000, "Notas muito longas")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  stage: z.enum(["prospecting", "proposal", "negotiation", "won", "lost"]).default("prospecting"),
});
```

`value` is validated as an integer number of cents at the schema boundary; the UI is responsible
for converting the user-typed reais amount (e.g. `"1500,00"`) into cents before calling the
schema, and for formatting cents back to `R$` for display.

## Server Actions

`src/app/app/deals/actions.ts` (new file, same pattern as `src/app/app/actions.ts`):

- `listDeals` — a single Drizzle query joining `deal` to `contact` (`leftJoin` on
  `deal.contactId = contact.id`) so each returned row already includes the linked contact's
  `name`, avoiding an N+1 or a second round-trip from the board view.
- `listContactsForPicker` — a thin wrapper around the existing contact-listing query (id + name
  only) for the create/edit form's contact `<select>`. Lives in `deals/actions.ts` rather than
  importing the Contacts feature's `listContacts` from `src/app/app/actions.ts`, to keep the two
  features' server actions independently deployable/testable — a two-line duplication is cheaper
  than a cross-feature import here.
- `createDeal`, `updateDeal` — validate via `dealInputSchema`, and additionally verify the given
  `contactId` resolves to a contact owned by the same user (a scoped `select` before the
  write) — so a user can't attach a deal to someone else's contact by guessing a UUID.
- `updateDealStage(id, stage)` — a focused action for the per-card stage `<select>`, taking just
  the new stage value (validated against the same 5-value enum) rather than the whole
  `dealInputSchema`, so a stage change doesn't require re-sending/re-validating title/value/notes.
- `deleteDeal` — same confirm-then-delete pattern as contacts.

Every action requires a session and scopes all reads/writes to `eq(deal.userId, userId)`,
mirroring the contacts actions exactly.

## Design Language

Reuses the existing design system and the Contacts feature's established patterns: same dark
teal/emerald palette, same `Card`/`Button`/`Input`/`Label`/`Textarea` primitives, same
rounded-card list-item idiom. One new primitive: a plain native `<select>` styled to match
`Input`'s classes (no new shadcn dependency) — used for both the contact picker and the per-card
stage selector.

## Error Handling

- Same conventions as Contacts: inline Zod validation errors, inline server-action failure
  messages ("Não foi possível salvar a negociação." / "Não foi possível excluir a negociação.").
- The zero-contacts-yet state (described above) is handled as a UI guard, not an error — it's an
  expected, normal state for a brand-new account.

## Out of Scope (for this feature)

- Drag-and-drop card reordering/stage-changing
- Multiple pipelines, custom/configurable stages
- Deal activity timeline, task/reminder scheduling, email integration
- Revenue reports, forecasting, win-rate analytics
- Multi-currency (BRL only, matching the rest of the app's Portuguese/Brazilian orientation)

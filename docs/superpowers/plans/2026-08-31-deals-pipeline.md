# Sales Pipeline (Deals) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Kanban-style sales pipeline at `/app/deals`: 5 stage columns, deals linked to existing contacts, create/edit/delete, and stage changes via a per-card select (no drag-and-drop).

**Architecture:** One new Drizzle table (`deal`, FK to both `user` and `contact`). Server Actions in `src/app/app/deals/actions.ts` handle all mutations, mirroring the pattern already established by the Contacts feature (`src/app/app/actions.ts`) — same auth-scoping, same commit/review cadence. A client component (`DealBoard`) groups server-fetched deals into stage columns and renders `DealCard`s; a shared `DealForm` handles both create and edit.

**Tech Stack:** Same as the rest of the project — Next.js 16 (Server Components + Server Actions), Drizzle ORM + drizzle-kit, Zod, existing shadcn/ui primitives plus one new hand-written primitive (`Select`, a styled native `<select>` — no new shadcn/npm dependency), Framer Motion, Vitest.

**Important — lessons already baked into this plan from the Contacts feature's review cycle** (don't let these regress; reviewers should confirm they're present, not treat them as unexpected extras):
1. `updateDeal` sets each nullable field explicitly with `?? null` instead of spreading the parsed Zod output directly — spreading would leave `undefined` for cleared optional fields, and Drizzle's `.set()` silently drops `undefined` keys, so a cleared field would never actually persist as NULL.
2. `DealForm` uses `useId()` from the start for every field's `id`/`htmlFor` pair, since (like `ContactForm`) it is not a singleton — the board's always-mounted create form and any card's edit-in-place form can exist simultaneously, and static ids would collide.
3. Delete buttons wrap their action in try/catch with loading/error state, not a bare `onClick`.
4. Long text (title, notes, contact name) gets `break-words` **and** `min-w-0` on any flex-row ancestor — `break-words` alone does not shrink a flex item below its content's natural width.
5. Every form field uses a real `<Label htmlFor>`/input `id` pair — no placeholder-only labeling.

**`.env.local` already has a real, working `DATABASE_URL`** (same live Neon database used by production). Test everything for real against it — actual signups, actual CRUD, not just typecheck. Do not print its contents in any report.

---

## File Structure

```
sistema-crm/
  src/
    db/
      schema.ts                      (modified: add `deal` table)
    lib/
      validation.ts                  (modified: add dealInputSchema)
      currency.ts                    (new: parseCurrencyToCents / formatCentsToBRL)
      deal-stages.ts                 (new: DEAL_STAGES display list, single source of truth)
    components/
      ui/
        select.tsx                   (new: hand-written native <select> wrapper)
      deals/
        DealForm.tsx                 (new)
        DealCard.tsx                 (new)
        DealBoard.tsx                (new)
    app/
      app/
        layout.tsx                   (modified: add "Funil" nav link, widen container)
        deals/
          actions.ts                 (new)
          page.tsx                   (new)
  tests/
    currency.test.ts                 (new)
    validation.test.ts               (modified: add dealInputSchema tests)
  drizzle/
    0002_*.sql                       (new migration)
```

---

### Task 1: Deal schema + migration

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add the `deal` table**

Change the import line at the top of `src/db/schema.ts` from:

```ts
import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
```

to:

```ts
import { pgTable, text, timestamp, boolean, uuid, integer, date } from "drizzle-orm/pg-core";
```

Append this table definition at the end of the file:

```ts

export const deal = pgTable("deal", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id")
    .notNull()
    .references(() => contact.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  value: integer("value"),
  expectedCloseDate: date("expected_close_date"),
  notes: text("notes"),
  stage: text("stage").notNull().default("prospecting"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

`value` is an integer number of cents (not a float) — standard practice for money, avoids
rounding errors. `contactId` cascades on delete: deleting a contact deletes their deals too
(same pattern as `user → contact`).

- [ ] **Step 2: Generate the migration**

```bash
npx drizzle-kit generate
```

Expected: a new SQL file under `drizzle/` (e.g. `drizzle/0002_*.sql`) creating the `deal` table
with foreign keys to both `user.id` and `contact.id`, both `ON DELETE CASCADE`.

- [ ] **Step 3: Apply the migration to the real database**

`drizzle-kit` doesn't auto-load `.env.local` in this project — use:

```bash
npx dotenvx run -f .env.local -- npx drizzle-kit migrate
```

Expected: reports the new migration applied with no errors. Verify the `deal` table exists with
the expected columns and both foreign keys (e.g. via a quick script using
`@neondatabase/serverless` against `information_schema.columns`/`table_constraints`, the same
approach used to verify Task 1 of the Contacts plan — don't print connection string contents).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add deal table and migration"
```

---

### Task 2: Currency helper (TDD)

**Files:**
- Create: `src/lib/currency.ts`
- Create: `tests/currency.test.ts`

- [ ] **Step 1: Write the failing tests**

`tests/currency.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseCurrencyToCents, formatCentsToBRL } from "@/lib/currency";

describe("parseCurrencyToCents", () => {
  it("parses a Brazilian-formatted amount with thousands separator", () => {
    expect(parseCurrencyToCents("1.500,00")).toBe(150000);
  });

  it("parses a plain comma-decimal amount", () => {
    expect(parseCurrencyToCents("1500,00")).toBe(150000);
  });

  it("parses an integer with no decimals as whole reais", () => {
    expect(parseCurrencyToCents("1500")).toBe(150000);
  });

  it("rounds a single-digit decimal correctly", () => {
    expect(parseCurrencyToCents("10,5")).toBe(1050);
  });

  it("returns undefined for an empty string", () => {
    expect(parseCurrencyToCents("")).toBeUndefined();
  });

  it("returns undefined for a whitespace-only string", () => {
    expect(parseCurrencyToCents("   ")).toBeUndefined();
  });

  it("returns undefined for non-numeric input", () => {
    expect(parseCurrencyToCents("abc")).toBeUndefined();
  });
});

describe("formatCentsToBRL", () => {
  it("formats cents as a Brazilian real amount", () => {
    expect(formatCentsToBRL(150000)).toContain("1.500,00");
  });

  it("formats zero correctly", () => {
    expect(formatCentsToBRL(0)).toContain("0,00");
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/currency'`.

- [ ] **Step 3: Implement the helper**

`src/lib/currency.ts`:

```ts
export function parseCurrencyToCents(input: string): number | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  const withoutStrayChars = trimmed.replace(/[^\d,.-]/g, "");
  // Treat a "." as a thousands separator only when followed by exactly three digits
  // and then a non-digit or end-of-string (e.g. "1.500,00" or "1.500") — otherwise
  // it's a decimal point (e.g. "1500.00").
  const withoutThousands = withoutStrayChars.replace(/\.(?=\d{3}(?:\D|$))/g, "");
  const normalized = withoutThousands.replace(",", ".");

  const asFloat = Number.parseFloat(normalized);
  if (Number.isNaN(asFloat)) return undefined;
  return Math.round(asFloat * 100);
}

export function formatCentsToBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test`
Expected: all tests pass (9 previously + 9 new = 18, exact count depends on what's already in the
suite — confirm no failures).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add currency parsing/formatting helper with tests"
```

---

### Task 3: Deal validation schema (TDD)

**Files:**
- Modify: `src/lib/validation.ts`
- Modify: `tests/validation.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/validation.test.ts` (new `describe` block, after the existing
`contactInputSchema` one):

```ts
import { dealInputSchema } from "@/lib/validation";

describe("dealInputSchema", () => {
  const validContactId = "123e4567-e89b-12d3-a456-426614174000";

  it("accepts a valid deal with only title and contactId", () => {
    const result = dealInputSchema.safeParse({ title: "Contrato Acme", contactId: validContactId });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.stage).toBe("prospecting");
  });

  it("rejects an empty title", () => {
    const result = dealInputSchema.safeParse({ title: "   ", contactId: validContactId });
    expect(result.success).toBe(false);
  });

  it("rejects a missing/invalid contactId", () => {
    const result = dealInputSchema.safeParse({ title: "Contrato Acme", contactId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative value", () => {
    const result = dealInputSchema.safeParse({ title: "Contrato Acme", contactId: validContactId, value: -100 });
    expect(result.success).toBe(false);
  });

  it("accepts a valid non-negative integer value", () => {
    const result = dealInputSchema.safeParse({ title: "Contrato Acme", contactId: validContactId, value: 150000 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.value).toBe(150000);
  });

  it("rejects an invalid stage", () => {
    const result = dealInputSchema.safeParse({ title: "Contrato Acme", contactId: validContactId, stage: "closed" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid stage", () => {
    const result = dealInputSchema.safeParse({ title: "Contrato Acme", contactId: validContactId, stage: "won" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.stage).toBe("won");
  });

  it("treats an empty-string expectedCloseDate as undefined", () => {
    const result = dealInputSchema.safeParse({ title: "Contrato Acme", contactId: validContactId, expectedCloseDate: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.expectedCloseDate).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test`
Expected: FAIL — `dealInputSchema` is not exported from `@/lib/validation` yet.

- [ ] **Step 3: Implement the schema**

Append to `src/lib/validation.ts` (keep the existing `contactInputSchema` untouched):

```ts

export const dealInputSchema = z.object({
  title: z.string().trim().min(1, "O título é obrigatório").max(200, "Título muito longo"),
  contactId: z.string().uuid("Selecione um contato"),
  value: z.number().int().nonnegative("O valor não pode ser negativo").optional(),
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

export type DealInput = z.infer<typeof dealInputSchema>;
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test`
Expected: all tests pass, including the 8 new `dealInputSchema` tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add deal validation schema with tests"
```

---

### Task 4: Deal CRUD server actions

**Files:**
- Create: `src/app/app/deals/actions.ts`

- [ ] **Step 1: Write the server actions**

`src/app/app/deals/actions.ts`:

```ts
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
```

Note: `updateDeal` explicitly writes `?? null` per nullable field — do not simplify this to
`{ ...data, updatedAt: new Date() }`. Spreading `data` directly would leave `undefined` for any
cleared optional field (`value`/`expectedCloseDate`/`notes`), and Drizzle's `.set()` silently
drops keys whose value is `undefined`, so the old value would stay in the database. This exact
bug was found and fixed in the Contacts feature's `updateContact` — don't reintroduce it here.

`listContactsForPicker` intentionally duplicates the shape of the Contacts feature's
`listContacts` (in `src/app/app/actions.ts`) rather than importing it, keeping the two features'
server actions independently self-contained.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean, no errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add deal CRUD server actions"
```

(No standalone unit test here — same rationale as the Contacts feature's actions: these require
a live session and DB connection, exercised end-to-end in Task 6's manual verification.)

---

### Task 5: Deal UI components

**Files:**
- Create: `src/components/ui/select.tsx`
- Create: `src/lib/deal-stages.ts`
- Create: `src/components/deals/DealForm.tsx`
- Create: `src/components/deals/DealCard.tsx`
- Create: `src/components/deals/DealBoard.tsx`

- [ ] **Step 1: Write the native select primitive**

`src/components/ui/select.tsx`:

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export { Select };
```

This is a hand-written primitive styled to match `src/components/ui/input.tsx`'s classes — not a
`shadcn` CLI addition, per the design spec's explicit decision to avoid a new dependency for a
single native `<select>` use case.

- [ ] **Step 2: Write the shared stage list**

`src/lib/deal-stages.ts`:

```ts
import type { DealInput } from "./validation";

export const DEAL_STAGES: { value: DealInput["stage"]; label: string }[] = [
  { value: "prospecting", label: "Prospecção" },
  { value: "proposal", label: "Proposta" },
  { value: "negotiation", label: "Negociação" },
  { value: "won", label: "Ganho" },
  { value: "lost", label: "Perdido" },
];
```

Single source of truth for stage labels — used by both the board's column headers and each
card's stage `<select>`, so a stage can never be relabeled in one place and not the other.

- [ ] **Step 3: Write the deal form (used for both create and edit)**

`src/components/deals/DealForm.tsx`:

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { formatCentsToBRL, parseCurrencyToCents } from "@/lib/currency";
import type { DealInput } from "@/lib/validation";

export type ContactOption = { id: string; name: string };

export function DealForm({
  contacts,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  contacts: ContactOption[];
  initialValues?: {
    title?: string;
    contactId?: string;
    value?: number | null;
    expectedCloseDate?: string | null;
    notes?: string | null;
    stage?: DealInput["stage"];
  };
  submitLabel: string;
  onSubmit: (values: DealInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [contactId, setContactId] = useState(initialValues?.contactId ?? contacts[0]?.id ?? "");
  const [value, setValue] = useState(
    initialValues?.value != null ? formatCentsToBRL(initialValues.value).replace("R$", "").trim() : ""
  );
  const [expectedCloseDate, setExpectedCloseDate] = useState(initialValues?.expectedCloseDate ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [stage] = useState<DealInput["stage"]>(initialValues?.stage ?? "prospecting");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formId = useId();
  const titleId = `${formId}-title`;
  const contactSelectId = `${formId}-contact`;
  const valueId = `${formId}-value`;
  const dateId = `${formId}-date`;
  const notesId = `${formId}-notes`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        title,
        contactId,
        value: parseCurrencyToCents(value),
        expectedCloseDate,
        notes,
        stage,
      });
    } catch {
      setError("Não foi possível salvar a negociação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={titleId}>Título</Label>
          <Input id={titleId} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={contactSelectId}>Contato</Label>
          <Select
            id={contactSelectId}
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            required
          >
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={valueId}>Valor (R$)</Label>
          <Input id={valueId} placeholder="0,00" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={dateId}>Previsão de fechamento</Label>
          <Input
            id={dateId}
            type="date"
            value={expectedCloseDate ?? ""}
            onChange={(e) => setExpectedCloseDate(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={notesId}>Notas</Label>
        <Textarea
          id={notesId}
          placeholder="Notas (opcional)"
          value={notes ?? ""}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !title.trim() || !contactId}>
          {loading ? "Salvando..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
```

Note: `stage` is tracked but has no input control here — stage changes happen through each
card's dedicated `<select>` (`DealCard`, wired to `updateDealStage`), not through this form. On
create, it stays at its default (`"prospecting"`); on edit, it's carried through unchanged from
whatever the deal's current stage already is (passed in via `initialValues.stage`), so editing
other fields can never accidentally reset a deal's stage.

If `contacts` is empty, this component still renders (an empty `<select>` with no options) —
`DealBoard` (Step 5) is responsible for not rendering `DealForm` at all when there are zero
contacts, showing a prompt instead.

- [ ] **Step 4: Write the deal card (view + edit-in-place + stage select + delete)**

`src/components/deals/DealCard.tsx`:

```tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DealForm, type ContactOption } from "./DealForm";
import { DEAL_STAGES } from "@/lib/deal-stages";
import { formatCentsToBRL } from "@/lib/currency";
import type { DealInput } from "@/lib/validation";

export type Deal = {
  id: string;
  title: string;
  value: number | null;
  expectedCloseDate: string | null;
  notes: string | null;
  stage: string;
  contactId: string;
  contactName: string;
};

export function DealCard({
  deal,
  contacts,
  onUpdate,
  onStageChange,
  onDelete,
}: {
  deal: Deal;
  contacts: ContactOption[];
  onUpdate: (id: string, values: DealInput) => Promise<void>;
  onStageChange: (id: string, stage: DealInput["stage"]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);

  if (editing) {
    return (
      <li className="rounded-xl border border-border bg-card p-4">
        <DealForm
          contacts={contacts}
          initialValues={{
            title: deal.title,
            contactId: deal.contactId,
            value: deal.value,
            expectedCloseDate: deal.expectedCloseDate,
            notes: deal.notes,
            stage: deal.stage as DealInput["stage"],
          }}
          submitLabel="Salvar"
          onCancel={() => setEditing(false)}
          onSubmit={async (values) => {
            await onUpdate(deal.id, values);
            setEditing(false);
          }}
        />
      </li>
    );
  }

  async function handleDelete() {
    setDeleteError(null);
    setDeleting(true);
    try {
      await onDelete(deal.id);
    } catch {
      setDeleteError("Não foi possível excluir a negociação.");
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  async function handleStageChange(newStage: string) {
    setStageError(null);
    try {
      await onStageChange(deal.id, newStage as DealInput["stage"]);
    } catch {
      setStageError("Não foi possível mover a negociação.");
    }
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
    >
      <p className="min-w-0 break-words font-medium">{deal.title}</p>
      <p className="min-w-0 break-words text-sm text-muted-foreground">{deal.contactName}</p>
      {deal.value != null && <p className="text-sm text-foreground">{formatCentsToBRL(deal.value)}</p>}
      {deal.expectedCloseDate && (
        <p className="text-xs text-muted-foreground">
          Previsão: {new Date(`${deal.expectedCloseDate}T00:00:00`).toLocaleDateString("pt-BR")}
        </p>
      )}
      {deal.notes && <p className="min-w-0 break-words text-sm text-muted-foreground">{deal.notes}</p>}

      <Select aria-label="Estágio" value={deal.stage} onChange={(e) => handleStageChange(e.target.value)}>
        {DEAL_STAGES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
      {stageError && <p className="text-sm text-destructive">{stageError}</p>}
      {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}

      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          Editar
        </Button>
        {confirmingDelete ? (
          <>
            <Button size="sm" variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? "Excluindo..." : "Confirmar"}
            </Button>
            <Button size="sm" variant="ghost" disabled={deleting} onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(true)}>
            Excluir
          </Button>
        )}
      </div>
    </motion.li>
  );
}
```

- [ ] **Step 5: Write the board (columns, create form, zero-contacts guard)**

`src/components/deals/DealBoard.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { DealCard, type Deal } from "./DealCard";
import { DealForm, type ContactOption } from "./DealForm";
import { DEAL_STAGES } from "@/lib/deal-stages";
import type { DealInput } from "@/lib/validation";

export function DealBoard({
  initialDeals,
  contacts,
  onCreate,
  onUpdate,
  onStageChange,
  onDelete,
}: {
  initialDeals: Deal[];
  contacts: ContactOption[];
  onCreate: (values: DealInput) => Promise<void>;
  onUpdate: (id: string, values: DealInput) => Promise<void>;
  onStageChange: (id: string, stage: DealInput["stage"]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [formResetKey, setFormResetKey] = useState(0);

  async function handleCreate(values: DealInput) {
    await onCreate(values);
    setFormResetKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      {contacts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Você precisa ter pelo menos um contato antes de criar uma negociação.{" "}
          <Link href="/app" className="text-primary underline">
            Adicionar contato
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4">
          <DealForm
            key={formResetKey}
            contacts={contacts}
            submitLabel="Adicionar negociação"
            onSubmit={handleCreate}
          />
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2">
        {DEAL_STAGES.map((stageDef) => {
          const dealsInStage = initialDeals.filter((d) => d.stage === stageDef.value);
          return (
            <div key={stageDef.value} className="flex w-72 shrink-0 flex-col gap-3">
              <h2 className="text-sm font-semibold text-muted-foreground">
                {stageDef.label} ({dealsInStage.length})
              </h2>
              {dealsInStage.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma negociação</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {dealsInStage.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        contacts={contacts}
                        onUpdate={onUpdate}
                        onStageChange={onStageChange}
                        onDelete={onDelete}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit` and `npm run lint`
Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add deal board, form, and card components"
```

---

### Task 6: Wire `/app/deals` and verify end-to-end

**Files:**
- Create: `src/app/app/deals/page.tsx`
- Modify: `src/app/app/layout.tsx`

- [ ] **Step 1: Write the deals page**

`src/app/app/deals/page.tsx`:

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DealBoard } from "@/components/deals/DealBoard";
import { listDeals, listContactsForPicker, createDeal, updateDeal, updateDealStage, deleteDeal } from "./actions";

export default async function DealsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login?session_expired=1");
  }

  const [deals, contacts] = await Promise.all([listDeals(), listContactsForPicker()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Funil de vendas</h1>
      <DealBoard
        initialDeals={deals}
        contacts={contacts}
        onCreate={createDeal}
        onUpdate={updateDeal}
        onStageChange={updateDealStage}
        onDelete={deleteDeal}
      />
    </div>
  );
}
```

- [ ] **Step 2: Add the nav link and widen the shared container**

Modify `src/app/app/layout.tsx` to:

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

The container widens from `max-w-2xl` to `max-w-6xl` — needed for 5 Kanban columns to have
reasonable room; this also affects the Contacts page (`/app`), which just gets more breathing
room on desktop (its own content doesn't stretch to fill it), not a regression. The board's own
`overflow-x-auto` (from `DealBoard`) handles any width still too narrow for all 5 columns, rather
than relying on the container alone.

No changes are needed to `src/proxy.ts` — its `PROTECTED_ROUTES` check uses
`pathname.startsWith("/app")`, which already covers `/app/deals`, and its `matcher` already
includes `/app/:path*`.

- [ ] **Step 3: Manual verification against the real database**

Run `npm run dev` and actually exercise the feature:

1. Log in with an existing test account (reuse one from the Contacts feature's verification, or
   sign up fresh) that has at least 2 contacts. If it has zero contacts, create 2 first via `/app`.
2. Visit `/app/deals` — should show 5 empty columns (Prospecção/Proposta/Negociação/Ganho/
   Perdido) and the create form with a contact `<select>` populated from your real contacts.
3. Create a deal: title "Contrato Piloto", pick a contact, value `1.500,00`, an expected-close
   date, some notes. Confirm it appears in the "Prospecção" column, showing the contact's name
   and `R$ 1.500,00`.
4. Create a second deal with no value/date/notes (title + contact only) — confirm it appears with
   just title/contact/stage select, no value/date/notes lines rendered.
5. Confirm the create form's fields are blank again after each successful create (not showing
   stale submitted values).
6. On the first deal's card, use the stage `<select>` to move it to "Proposta" — confirm it moves
   to that column immediately, and the count in both column headers updates.
7. Click "Editar" on a deal, change its value and notes, save — confirm the update shows
   immediately in the same column (edit doesn't change stage).
8. Click "Excluir", confirm, then confirm again — the deal disappears.
9. Reload the page — confirm the remaining deal and its current stage/column persisted.
10. Test the zero-contacts guard: temporarily using a fresh throwaway account with zero contacts,
    visit `/app/deals` — confirm the create form is replaced by the "Adicionar contato" prompt
    linking to `/app`, and no crash occurs.

Clean up test deals/contacts through the UI when done.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: wire deals dashboard into /app/deals with nav link"
```

---

### Task 7: Responsive verification pass

**Files:** none (verification only; fix any real issues found)

- [ ] **Step 1: Check `/app/deals` at mobile width (375px)**

With real deals created (including one with a long title/notes to check wrapping, per the
lessons-learned note at the top of this plan), visit `/app/deals` at 375×812.
Expected: no page-level horizontal scroll from the container itself; the column strip scrolls
horizontally within its own `overflow-x-auto` wrapper (this is expected Kanban behavior, not a
bug); the create form's fields stack to one column; long titles/notes/contact names wrap inside
their card rather than overflowing it.

- [ ] **Step 2: Check at tablet width (768×1024) and desktop width (1280×800)**

Expected: more columns visible without scrolling as width increases; the two-column field grid
in the create/edit form appears at `sm` and above; content stays inside the widened `max-w-6xl`
container from `src/app/app/layout.tsx`.

- [ ] **Step 3: Fix any issues found**

If something breaks, fix the specific Tailwind classes causing it. Re-check at all three widths.

- [ ] **Step 4: Commit (only if fixes were made)**

```bash
git add -A
git commit -m "fix: responsive layout issues in deals pipeline"
```

---

### Task 8: Deploy

**Files:** none

- [ ] **Step 1: Verify the production build**

```bash
npm run build
```

Expected: succeeds with no type errors (real `DATABASE_URL` available via `.env.local`).

- [ ] **Step 2: Push to trigger the Vercel deployment**

```bash
git push origin master
```

Expected: pushes cleanly; Vercel auto-deploys. No separate production migration step is needed —
Task 1 already migrated the one shared database used by both `.env.local` and production.

- [ ] **Step 3: Verify in production**

Once the deployment is live (e.g. poll the production homepage until its `ETag` header changes,
or just wait ~60-90 seconds), visit **https://sistema-crm-alpha.vercel.app**: log in, confirm
"Funil" appears in the nav, visit `/app/deals`, create a deal, confirm it appears in the right
column, reload to confirm persistence, change its stage, delete it, clean up.

---

## Self-Review Notes

- **Spec coverage**: data model with cascading FK to `contact` (Task 1), currency handling
  (Task 2), Zod validation including the 5-stage enum (Task 3), server actions with ownership
  checks on `contactId` (Task 4), Kanban board/card/form UI with per-card stage `<select>` and
  the zero-contacts guard (Task 5-6), nav link and widened layout (Task 6), responsive check
  (Task 7), deploy (Task 8) — all covered.
- **Type consistency**: `Deal` type in `DealCard.tsx` (`{ id, title, value, expectedCloseDate,
  notes, stage, contactId, contactName }`) matches exactly what `listDeals()`'s joined `select()`
  returns. `DealInput` (from `dealInputSchema`) is the single shared type threaded through
  `DealForm.onSubmit`, `DealBoard.onCreate/onUpdate`, and the server actions' parameters — no
  drift. `ContactOption` (`{ id, name }`) matches `listContactsForPicker()`'s projection exactly.
- **Regressions from the Contacts feature explicitly avoided by construction** (see the plan
  header): `updateDeal`'s explicit-null pattern, `DealForm`'s `useId()` usage, `DealCard`'s
  delete error handling, `break-words`+`min-w-0` on long text, real `<Label>` associations — all
  present in the Task 4/5 code above, not left for review to catch.
- **No placeholders**: all steps contain complete, runnable code or exact commands.

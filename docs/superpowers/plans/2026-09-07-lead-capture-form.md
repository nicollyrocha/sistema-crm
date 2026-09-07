# External Lead Capture Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This is frontend + backend work in a Next.js app — for any task that touches JSX/styling, dispatch it to the `frontend-ui-ux` subagent (see `.claude/agents/frontend-ui-ux.md`); for pure backend/schema/validation tasks, a general-purpose implementer is fine.

**Goal:** Let a Sistema CRM user share a public URL (`/f/<token>`) that lets anyone submit a lead without logging in, creating a new Contact with `status = "lead"` in that user's account, with basic spam protection and a way to view/copy/regenerate the link from the Contacts page.

**Architecture:** Two new tables (`lead_form_token`, one row per user; `lead_form_submission_log`, an IP+timestamp ledger for rate limiting). A new public route `src/app/f/[token]/` outside the authenticated `(shell)` route group and outside the proxy's matcher, so it needs no auth changes. A Server Action validates, checks a honeypot field and a 5-per-hour-per-IP rate limit, then inserts the contact. The Contacts page gets a new panel showing the link with copy/regenerate.

**Tech Stack:** Next.js 16.3.3 App Router (Server Actions), Drizzle ORM + Neon Postgres, Zod, Tailwind v4 + existing design tokens, Vitest.

**Reference:** Design spec at `docs/superpowers/specs/2026-09-07-lead-capture-form-design.md`.

---

## Task 1: Database schema — `lead_form_token` and `lead_form_submission_log`

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add the two new tables**

In `src/db/schema.ts`, the import line currently reads:
```ts
import { pgTable, text, timestamp, boolean, uuid, integer, date, index } from "drizzle-orm/pg-core";
```
Leave it unchanged (all needed helpers are already imported).

Add these two table definitions at the end of the file (after the `deal` table):

```ts

export const leadFormToken = pgTable("lead_form_token", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const leadFormSubmissionLog = pgTable(
  "lead_form_submission_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ip: text("ip").notNull(),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  },
  (table) => [index("lead_form_submission_log_ip_idx").on(table.ip)]
);
```

- [ ] **Step 2: Generate the migration**

Run: `npx drizzle-kit generate`
Expected: a new file appears under `drizzle/`, e.g. `drizzle/0004_<generated-name>.sql`, containing `CREATE TABLE "lead_form_token" ...` and `CREATE TABLE "lead_form_submission_log" ...` plus the index. Read the generated SQL file to confirm it matches — if drizzle-kit asks an interactive question about column defaults/constraints, that indicates the schema diff is ambiguous; re-check Step 1 rather than accepting a wrong default.

- [ ] **Step 3: Apply the migration to the database**

Run (this project keeps `DATABASE_URL` in `.env.local`, which `drizzle-kit` does not auto-load, so source it first):
```bash
set -a && source .env.local && set +a && npx drizzle-kit migrate
```
Expected: `[✓] migrations applied successfully!`

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors (confirms the new exported table objects type-check).

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: add lead_form_token and lead_form_submission_log tables"
```

---

## Task 2: Validation schema + rate-limit logic (TDD)

**Files:**
- Modify: `src/lib/validation.ts`
- Create: `src/lib/rate-limit.ts`
- Modify: `tests/validation.test.ts`
- Create: `tests/rate-limit.test.ts`

- [ ] **Step 1: Add `leadFormInputSchema` to `src/lib/validation.ts`**

Add this at the end of the file (after `dealInputSchema`/`DealInput`):

```ts

export const leadFormInputSchema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório").max(200, "Nome muito longo"),
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().email("Email inválido").max(200).optional()
  ),
  phone: z
    .string()
    .trim()
    .max(30, "Telefone muito longo")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  company: z
    .string()
    .trim()
    .max(200, "Nome da empresa muito longo")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  notes: z
    .string()
    .trim()
    .max(2000, "Mensagem muito longa")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});

export type LeadFormInput = z.infer<typeof leadFormInputSchema>;
```

- [ ] **Step 2: Add tests for `leadFormInputSchema`**

Append to `tests/validation.test.ts` (after the closing `});` of the `dealInputSchema` describe block, as a new top-level `describe`):

```ts

describe("leadFormInputSchema", () => {
  it("accepts a valid submission with only a name", () => {
    const result = leadFormInputSchema.safeParse({ name: "Maria Silva" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = leadFormInputSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = leadFormInputSchema.safeParse({ name: "Maria", email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("treats an empty-string email as undefined", () => {
    const result = leadFormInputSchema.safeParse({ name: "Maria", email: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBeUndefined();
  });

  it("treats empty-string optional fields as undefined", () => {
    const result = leadFormInputSchema.safeParse({
      name: "Maria",
      phone: "",
      company: "",
      notes: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeUndefined();
      expect(result.data.company).toBeUndefined();
      expect(result.data.notes).toBeUndefined();
    }
  });

  it("does not accept a status field (the public form cannot set it)", () => {
    const result = leadFormInputSchema.safeParse({ name: "Maria", status: "active" });
    expect(result.success).toBe(true);
    if (result.success) expect("status" in result.data).toBe(false);
  });
});
```

Also update the top of `tests/validation.test.ts` to import the new schema — change:
```ts
import { contactInputSchema, dealInputSchema } from "@/lib/validation";
```
to:
```ts
import { contactInputSchema, dealInputSchema, leadFormInputSchema } from "@/lib/validation";
```

- [ ] **Step 3: Run the new tests to verify they fail first**

Run: `npx vitest run tests/validation.test.ts`
Expected: FAIL — `leadFormInputSchema` doesn't exist yet if Step 1 wasn't done, or passes immediately if Step 1 is already in place. Since Step 1 comes first in this task, these should already PASS at this point — this step is a sanity check that they actually exercise real behavior (temporarily comment out the `notes: z.string()...` line's `.transform` in your head — if you're unsure the tests are meaningful, that's fine, proceed to Step 4).

- [ ] **Step 4: Create the rate-limit pure function**

Create `src/lib/rate-limit.ts`:

```ts
const WINDOW_MS = 60 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 5;

export function isRateLimited(submissionTimestamps: Date[], now: Date): boolean {
  const windowStart = now.getTime() - WINDOW_MS;
  const recentCount = submissionTimestamps.filter((t) => t.getTime() >= windowStart).length;
  return recentCount >= MAX_SUBMISSIONS_PER_WINDOW;
}
```

- [ ] **Step 5: Write tests for `isRateLimited`**

Create `tests/rate-limit.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isRateLimited } from "@/lib/rate-limit";

describe("isRateLimited", () => {
  const now = new Date("2026-09-07T12:00:00Z");

  it("returns false when there are no prior submissions", () => {
    expect(isRateLimited([], now)).toBe(false);
  });

  it("returns false when under the limit within the window", () => {
    const timestamps = [
      new Date("2026-09-07T11:50:00Z"),
      new Date("2026-09-07T11:55:00Z"),
    ];
    expect(isRateLimited(timestamps, now)).toBe(false);
  });

  it("returns true when at the limit within the window", () => {
    const timestamps = [
      new Date("2026-09-07T11:10:00Z"),
      new Date("2026-09-07T11:20:00Z"),
      new Date("2026-09-07T11:30:00Z"),
      new Date("2026-09-07T11:40:00Z"),
      new Date("2026-09-07T11:50:00Z"),
    ];
    expect(isRateLimited(timestamps, now)).toBe(true);
  });

  it("ignores submissions older than the one-hour window", () => {
    const timestamps = [
      new Date("2026-09-07T10:00:00Z"), // 2 hours ago — outside window
      new Date("2026-09-07T09:00:00Z"), // 3 hours ago — outside window
    ];
    expect(isRateLimited(timestamps, now)).toBe(false);
  });

  it("counts a submission exactly at the window boundary as within the window", () => {
    const timestamps = new Array(5).fill(null).map(() => new Date("2026-09-07T11:00:00Z")); // exactly 1 hour ago
    expect(isRateLimited(timestamps, now)).toBe(true);
  });
});
```

- [ ] **Step 6: Run all new tests to verify they pass**

Run: `npx vitest run tests/rate-limit.test.ts tests/validation.test.ts`
Expected: all tests PASS (11 new tests total: 6 for `leadFormInputSchema`, 5 for `isRateLimited`).

- [ ] **Step 7: Commit**

```bash
git add src/lib/validation.ts src/lib/rate-limit.ts tests/validation.test.ts tests/rate-limit.test.ts
git commit -m "feat: add lead form validation schema and rate-limit logic"
```

---

## Task 3: Token management server actions

**Files:**
- Modify: `src/app/(shell)/app/contacts/actions.ts`

- [ ] **Step 1: Add `getOrCreateFormToken` and `regenerateFormToken`**

In `src/app/(shell)/app/contacts/actions.ts`, change the imports at the top from:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contact } from "@/db/schema";
import { contactInputSchema, type ContactInput } from "@/lib/validation";
import { requireUserId } from "@/lib/session";
```
to:
```ts
"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contact, leadFormToken } from "@/db/schema";
import { contactInputSchema, type ContactInput } from "@/lib/validation";
import { requireUserId } from "@/lib/session";
```

Then add these two functions at the end of the file:

```ts

export async function getOrCreateFormToken(): Promise<string> {
  const userId = await requireUserId();
  await db
    .insert(leadFormToken)
    .values({ userId, token: randomUUID() })
    .onConflictDoNothing({ target: leadFormToken.userId });
  const [row] = await db.select().from(leadFormToken).where(eq(leadFormToken.userId, userId));
  return row.token;
}

export async function regenerateFormToken(): Promise<string> {
  const userId = await requireUserId();
  const token = randomUUID();
  await db
    .insert(leadFormToken)
    .values({ userId, token })
    .onConflictDoUpdate({ target: leadFormToken.userId, set: { token } });
  revalidatePath("/app/contacts");
  return token;
}
```

(`getOrCreateFormToken` is insert-if-absent-then-read, so two concurrent first-time calls can't collide on the primary key — the second insert is a no-op and both calls read back the same row. `regenerateFormToken` always overwrites, whether or not a row existed yet.)

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors (confirms Drizzle's `onConflictDoNothing`/`onConflictDoUpdate` API usage type-checks against this project's `drizzle-orm` version).

- [ ] **Step 3: Commit**

```bash
git add "src/app/(shell)/app/contacts/actions.ts"
git commit -m "feat: add getOrCreateFormToken and regenerateFormToken actions"
```

---

## Task 4: Public link panel on the Contacts page

**Files:**
- Create: `src/components/contacts/PublicFormLink.tsx`
- Modify: `src/app/(shell)/app/contacts/page.tsx`

- [ ] **Step 1: Create the panel component**

Create `src/components/contacts/PublicFormLink.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeleteConfirm } from "@/components/ui/delete-confirm";

export function PublicFormLink({
  baseUrl,
  token,
  onRegenerate,
}: {
  baseUrl: string;
  token: string;
  onRegenerate: () => Promise<string>;
}) {
  const [currentToken, setCurrentToken] = useState(token);
  const [copied, setCopied] = useState(false);
  const currentUrl = `${baseUrl}/f/${currentToken}`;

  const { confirming, deleting, error, requestDelete, cancelDelete, handleDelete } = useDeleteConfirm(async () => {
    const newToken = await onRegenerate();
    setCurrentToken(newToken);
  }, "Não foi possível gerar um novo link.");

  async function handleCopy() {
    await navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="surface-card flex flex-col gap-3 p-4">
      <div>
        <h2 className="text-sm font-semibold">Formulário de captação</h2>
        <p className="text-sm text-muted-foreground">
          Compartilhe esse link para receber novos contatos direto no seu CRM.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          readOnly
          value={currentUrl}
          onFocus={(e) => e.target.select()}
          aria-label="Link do formulário de captação"
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={handleCopy}>
          {copied ? "Copiado!" : "Copiar"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-1">
        {confirming ? (
          <>
            <Button type="button" size="sm" variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? "Gerando..." : "Confirmar"}
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={deleting} onClick={cancelDelete}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button type="button" size="sm" variant="ghost" onClick={requestDelete}>
            Gerar novo link
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire it into the Contacts page**

Replace the full contents of `src/app/(shell)/app/contacts/page.tsx`:

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ContactList } from "@/components/contacts/ContactList";
import { PublicFormLink } from "@/components/contacts/PublicFormLink";
import {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  getOrCreateFormToken,
  regenerateFormToken,
} from "./actions";

export default async function AppPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) {
    redirect("/login");
  }

  const [contacts, token] = await Promise.all([listContacts(), getOrCreateFormToken()]);

  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Contatos</h1>
      <PublicFormLink baseUrl={baseUrl} token={token} onRegenerate={regenerateFormToken} />
      <ContactList
        initialContacts={contacts}
        onCreate={createContact}
        onUpdate={updateContact}
        onDelete={deleteContact}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npx eslint`
Expected: no errors.

- [ ] **Step 4: Manual browser check**

Start the dev server, log in, open `/app/contacts`. Confirm the new "Formulário de captação" panel appears above the existing contact form, showing a URL like `http://localhost:3000/f/<some-uuid>`. Click "Copiar" and confirm the button label briefly changes to "Copiado!". Click "Gerar novo link", confirm it shows Confirmar/Cancelar, click "Confirmar", and confirm the URL in the input changes to a new token.

- [ ] **Step 5: Commit**

```bash
git add src/components/contacts/PublicFormLink.tsx "src/app/(shell)/app/contacts/page.tsx"
git commit -m "feat: show public lead-form link on the Contacts page"
```

---

## Task 5: Public route — the lead form itself

**Files:**
- Create: `src/app/f/[token]/page.tsx`
- Create: `src/app/f/[token]/actions.ts`
- Create: `src/components/leadform/LeadForm.tsx`

- [ ] **Step 1: Create the submission Server Action**

Create `src/app/f/[token]/actions.ts`:

```ts
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
```

- [ ] **Step 2: Create the form component**

Create `src/components/leadform/LeadForm.tsx`:

```tsx
"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitLeadForm } from "@/app/f/[token]/actions";

export function LeadForm({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const formId = useId();
  const nameId = `${formId}-name`;
  const emailId = `${formId}-email`;
  const phoneId = `${formId}-phone`;
  const companyId = `${formId}-company`;
  const notesId = `${formId}-notes`;
  const websiteId = `${formId}-website`;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await submitLeadForm(token, { name, email, phone, company, notes, website });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Não foi possível enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return <p className="text-sm text-muted-foreground">Obrigado! Entraremos em contato em breve.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5">
        <Label htmlFor={nameId}>Nome</Label>
        <Input id={nameId} value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} />
      </div>
      <div className="flex flex-col gap-2.5">
        <Label htmlFor={emailId}>Email</Label>
        <Input id={emailId} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2.5">
        <Label htmlFor={phoneId}>Telefone</Label>
        <Input id={phoneId} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2.5">
        <Label htmlFor={companyId}>Empresa</Label>
        <Input id={companyId} value={company} onChange={(e) => setCompany(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2.5">
        <Label htmlFor={notesId}>Mensagem</Label>
        <Textarea id={notesId} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
      </div>
      <div className="sr-only">
        <Label htmlFor={websiteId}>Não preencha este campo</Label>
        <input
          id={websiteId}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading || !name.trim()}>
        {loading ? "Enviando..." : "Enviar"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Create the page**

Create `src/app/f/[token]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leadFormToken } from "@/db/schema";
import { LeadForm } from "@/components/leadform/LeadForm";

export default async function LeadFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [row] = await db.select().from(leadFormToken).where(eq(leadFormToken.token, token));
  if (!row) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="surface-card w-full max-w-sm p-8">
        <h1 className="mb-1 text-lg font-semibold">Sistema CRM</h1>
        <p className="mb-6 text-sm text-muted-foreground">Preencha seus dados e entraremos em contato.</p>
        <LeadForm token={token} />
      </div>
    </main>
  );
}
```

If this `params: Promise<{ token: string }>` shape produces a type error, read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md` (this project's Next.js 16.3.3 has non-standard behavior per its `AGENTS.md` — do not assume the shape from general Next.js knowledge) and adjust to match this version's actual dynamic-route params convention, then continue.

- [ ] **Step 4: Verify the proxy doesn't touch this route**

Run: `grep -n "matcher" -A 3 src/proxy.ts`
Expected: the `matcher` array lists `/app/:path*`, `/account/:path*`, `/login`, `/signup`, `/forgot-password`, `/reset-password` — `/f/:path*` is NOT in that list, so no code change is needed here; this step is just confirming the assumption from the design doc still holds.

- [ ] **Step 5: Verify build/lint/types**

Run: `npx tsc --noEmit && npx eslint`
Expected: no errors.

Run: `npx next build`
Expected: succeeds; the route table should list a new dynamic route for `/f/[token]`.

- [ ] **Step 6: Manual browser verification (do all of these)**

Start the dev server. Get a real link by logging in and visiting `/app/contacts` (from Task 4).

1. Open the link in a new tab (simulating an external visitor) — confirm the public page renders with no sidebar/nav, just the branded card and form.
2. Submit with just a name filled in — confirm it succeeds and shows "Obrigado! Entraremos em contato em breve."
3. Go back to `/app/contacts` (as the logged-in owner) and confirm the new contact appears with status "Lead".
4. Visit the link again, fill in all fields including a message, submit, and confirm the new contact has phone/company/notes populated correctly.
5. Open browser dev tools, find the hidden honeypot input (name="website"), set its value to something non-empty via the console, submit — confirm it reports success but NO new contact is created.
6. Submit the form 6 times in a row (real submissions, not honeypot) from the same browser — confirm the 6th attempt shows "Muitas tentativas, tente novamente mais tarde." and does not create a contact.
7. Visit `/f/this-token-does-not-exist` — confirm the standard Next.js not-found page renders (not a crash).
8. From `/app/contacts`, click "Gerar novo link", confirm it, then visit the OLD link in a new tab — confirm it now 404s (not-found), and the NEW link still works.
9. Check both light and dark theme on the public page.
10. Delete any test contacts you created during this verification so the dev database is left as found.

- [ ] **Step 7: Commit**

```bash
git add src/app/f src/components/leadform
git commit -m "feat: add public lead capture form and submission handling"
```

---

## Task 6: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated suite**

```bash
npx vitest run
npx tsc --noEmit
npx eslint
npx next build
```
Expected: all four succeed. `vitest run` should report more tests passing than before this plan started (the new `leadFormInputSchema` and `isRateLimited` tests).

- [ ] **Step 2: Re-confirm the end-to-end flow once more** after all tasks are merged together (a link generated in Task 4 should still work through the Task 5 submission flow) — repeat the 10-point walkthrough from Task 5 Step 6 briefly if anything in later tasks touched the same files.

- [ ] **Step 3: Final commit** (only if Step 2 required fixes; otherwise this task produces no diff)

```bash
git add -A
git commit -m "fix: address issues found during lead capture form verification pass"
```

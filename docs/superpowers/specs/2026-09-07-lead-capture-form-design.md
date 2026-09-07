# External Lead Capture Form — Design Doc

**Date:** 2026-09-07
**Status:** Approved by user, pending implementation plan

## Context

This is the first of six features requested together and explicitly decomposed into separate spec → plan → implementation cycles (per user's own choice: "começa pelo formulário de lead externo, um de cada vez"). The other five (dynamic per-user pipeline stages with templates, loss reasons, UTM campaign tracking, email sending, and companies/lists) are out of scope here and will each get their own design cycle later. UTM tracking in particular is explicitly meant to build on top of this form later — this design does not add UTM capture, but the public route/action structure here is where that will attach.

## Goal

Let a Sistema CRM user share a public URL that lets anyone submit a lead (name/email/phone/company/message) without logging in, landing as a new Contact with `status = "lead"` in that user's account. No new external services or paid dependencies.

## Data model

Two new tables in `src/db/schema.ts`, no changes to any existing table:

```
lead_form_token
  user_id     text PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE
  token       text NOT NULL UNIQUE
  created_at  timestamp NOT NULL DEFAULT now()

lead_form_submission_log
  id           uuid PRIMARY KEY DEFAULT random
  ip           text NOT NULL
  submitted_at timestamp NOT NULL DEFAULT now()
```

- `lead_form_token` is one row per user (primary key IS `user_id`, not a separate `id`), created lazily the first time a user visits `/app/contacts` (no signup-flow changes needed, and it backfills correctly for every existing user the first time they load that page). "Gerar novo link" overwrites the `token` value in place on the same row — the old token stops resolving immediately.
- `lead_form_submission_log` is an append-only ledger used only to compute a rolling-hour count per IP for rate limiting. Rows can be pruned by a future maintenance task; not addressed in this design (fine to let it grow for now given expected volume).
- Token values are generated with Node's built-in `crypto.randomUUID()` — no new dependency.

## Public route: `/f/[token]`

- A new top-level route (NOT under the `(shell)` route group — no sidebar, no auth). Next.js's proxy `matcher` in `src/proxy.ts` only lists `/app/:path*`, `/account/:path*`, and the auth pages, so `/f/*` is naturally untouched by the auth proxy with no changes needed there.
- Server Component page: looks up the token against `lead_form_token`. If not found, call Next's `notFound()` (renders the standard not-found page — no need for a custom "invalid link" design).
- If found, renders a centered card (visually matching the existing login/signup page style: `surface-card`, centered layout, "Sistema CRM" wordmark) containing the lead form.
- Fields: Nome (required), Email (optional, validated if present), Telefone (optional), Empresa (optional), Mensagem (optional, free text — stored as the contact's `notes`).
- A hidden honeypot field (e.g. name `website`), visually hidden via `sr-only` (not `display:none`, which some bots detect) and excluded from tab order.
- On submit, a Server Action validates and either creates the contact or rejects. On success, the form is replaced in place with "Obrigado! Entraremos em contato em breve." — no redirect.

## Submission handling (Server Action)

New file `src/app/f/[token]/actions.ts`, exporting `submitLeadForm(token: string, formData: LeadFormInput)`:

1. Look up `lead_form_token` by token. If missing, throw (page already guards this via `notFound()`, but the action re-checks independently since it can be called directly).
2. Honeypot check: if the hidden field is non-empty, return a success response WITHOUT inserting anything (so a bot can't tell it was caught).
3. Rate limit: read the caller's IP from the standard forwarded-for header, count `lead_form_submission_log` rows for that IP in the last hour; if ≥ 5, return a rate-limited error ("Muitas tentativas, tente novamente mais tarde.") without inserting a contact or logging another attempt.
4. Validate the payload with a new `leadFormInputSchema` in `src/lib/validation.ts` (same shape/rules as the existing `contactInputSchema`'s optional-field handling, minus `status`).
5. Insert a `lead_form_submission_log` row for this IP (counted whether or not the contact insert below succeeds, so validation-failure retries still count toward the limit).
6. Insert the new `contact` row: `userId` = the token's owner, `status = "lead"`, mapped fields, `notes` = the message field.
7. `revalidatePath("/app/contacts")` so the owner's contact list is fresh next time they load it (same pattern already used in `src/app/(shell)/app/contacts/actions.ts`).

## In-app management UI

On `src/app/(shell)/app/contacts/page.tsx`, a new panel above the existing "Adicionar contato" form:

- Fetches (or lazily creates) the user's token via a new `getOrCreateFormToken()` server action in `contacts/actions.ts`.
- Builds the full public URL from the current request's host (via `headers()` in the Server Component — works automatically in both local dev and production, no new env var).
- Renders a read-only text input with the full URL, a "Copiar" button (Clipboard API), and a "Gerar novo link" button that calls a new `regenerateFormToken()` server action after an inline confirm step (reusing the existing `useDeleteConfirm`/`DeleteConfirmButtons` pattern already used for contact/deal deletion, since it's the same "confirm before an irreversible-ish action" shape).

## Non-goals (explicitly out of scope for this design)

- UTM parameter capture (next feature in the sequence — will extend this form's action, not replace it).
- CAPTCHA or third-party spam services.
- Configurable success-redirect URL (fixed inline "thank you" message only).
- Embeddable iframe version (dedicated page only).
- Any change to how existing (authenticated) contact creation works.

## Testing

- Unit tests (Vitest) for `leadFormInputSchema` (mirroring the existing `contactInputSchema` test style) and for the rate-limit counting logic (pure function taking a list of timestamps + "now", returning whether the limit is exceeded — extracted so it's testable without a database).
- Manual browser verification: generate a link from `/app/contacts`, submit a real lead, confirm it appears in the contact list as a Lead; submit the honeypot field filled in and confirm no contact is created; submit 6 times rapidly and confirm the 6th is rejected; visit `/f/<garbage>` and confirm the not-found page renders; regenerate the link and confirm the old URL now 404s.

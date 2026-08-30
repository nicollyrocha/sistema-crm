# Sistema CRM Harness — Design Spec

Date: 2026-08-30

## Purpose

Scaffold ("harness") for a new CRM application: complete auth + account system and a marketing
landing page, deployed on Vercel with Neon Postgres. No CRM-specific data model yet — the
authenticated area (`/app`) is a protected placeholder dashboard meant to be built out with real
CRM features (contacts, leads, pipeline, etc.) in a later spec. This mirrors the harness already
built for `todo-list` (see `../../../../todo-list/docs/superpowers/specs/2026-08-25-todo-list-harness-design.md`),
minus the task-CRUD domain.

## Stack

- **Framework:** Next.js 16, App Router, TypeScript
- **Database:** Neon (serverless Postgres)
- **ORM:** Drizzle ORM + drizzle-kit for migrations
- **Auth:** Better Auth (Vercel's authentication product) — email/password, password reset via
  email, email change with confirmation, session management
- **File storage:** Vercel Blob — profile photo upload
- **Styling:** Tailwind CSS + shadcn/ui primitives, custom design system on top
- **Animation:** Framer Motion for micro-interactions
- **Deployment:** Vercel

## Data Model

```
user            -- owned by Better Auth's schema
  id, name, email, emailVerified, image, createdAt, updatedAt

session         -- owned by Better Auth
account         -- owned by Better Auth (credential storage)
verification    -- owned by Better Auth (reset/verify tokens)
```

No application-owned tables yet. Better Auth owns and migrates its own tables via its Drizzle
adapter. Future CRM entities (contacts, deals, etc.) get added to this same Drizzle schema in a
follow-up spec, once requirements for the CRM domain itself are defined.

## Routes / Pages

| Route              | Auth | Purpose                                                            |
|---------------------|------|---------------------------------------------------------------------|
| `/`                 | no   | Landing page: hero, feature highlights, CTA to sign up / log in     |
| `/login`            | no   | Email/password login                                                |
| `/signup`           | no   | Email/password registration                                         |
| `/forgot-password`  | no   | Request password reset email                                        |
| `/reset-password`   | no   | Set new password from emailed token                                 |
| `/app`              | yes  | Placeholder dashboard (welcome message) — CRM features land here later |
| `/account`          | yes  | Change name, change email (with confirmation), change password, upload avatar |

Unauthenticated users hitting `/app` or `/account` are redirected to `/login`. Authenticated
users hitting `/login` or `/signup` are redirected to `/app`.

## Account Features (via Better Auth)

- Login / logout
- Sign up with email + password
- Forgot password → emailed reset link → set new password
- Change password (while logged in, requires current password)
- Change email (requires confirmation via email to the new address)
- Upload / replace profile photo (stored in Vercel Blob, URL saved on `user.image`)

## Design Language

Modern, distinctive, single coherent identity (not multiple selectable themes):

- Dark-first palette with one vibrant gradient accent color (distinct hue from the todo-list
  harness, so the two projects don't look identical)
- Bold display typography for headings
- Cards with subtle depth (soft shadows / light glassmorphism), not flat/generic
- Framer Motion micro-interactions on key UI transitions (form submit states, page entry)
- Fully responsive, mobile-first: verified at mobile (~375px), tablet (~768px), desktop (~1280px)
- Landing page reuses the same visual language as the rest of the app

## Error Handling

- Form validation (Zod) on all auth forms, client + server side
- Server actions / API routes return typed error responses; UI surfaces inline field errors and
  toast notifications for request-level failures
- Auth errors (invalid credentials, expired reset token, etc.) shown inline on the relevant form

## Environment / Deployment

- `DATABASE_URL` — Neon connection string
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` — Better Auth config
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob
- Email delivery for password reset / email-change confirmation via Resend
- Drizzle migrations run via `drizzle-kit` against the Neon connection string

## Out of Scope (for this harness)

- Any CRM domain feature (contacts, leads, pipeline, deals, reports) — needs its own spec once
  requirements are defined
- Social/OAuth login providers (email/password only for now)
- Multiple selectable UI themes
- Offline support / PWA

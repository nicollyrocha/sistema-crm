# Design Refresh — Design Doc

**Date:** 2026-09-04
**Status:** Approved by user, pending implementation plan

## Goal

Give the whole system (landing page, auth flows, dashboard, contacts, deals, account) a cohesive, current-market SaaS visual identity — inspired by Notion/Attio/Linear's "soft SaaS" aesthetic — without changing any existing behavior, data flow, or business logic. This is a presentation-layer project: every page keeps doing exactly what it does today, just looking and adapting to screen size better.

## Non-goals

- No new features, no changed validation/business rules, no new routes beyond the layout restructure described below.
- No changes to `src/lib/*` logic, server actions, or the database schema.
- No new automated tests are expected for pure visual changes — verification is manual/visual (see Testing below). Existing Vitest suite must keep passing untouched.

## Decisions made during brainstorming

| Decision | Choice |
|---|---|
| Scope | Whole system in one coordinated pass |
| Visual direction | "Soft SaaS" — Notion/Attio/Linear-inspired: warm neutrals, generous rounded corners, soft shadows, friendly but professional |
| App navigation | Migrate from top navbar to a persistent left sidebar (drawer on mobile) |
| Theme | Both light and dark, with a toggle; defaults to OS preference, user choice persisted |
| Accent color | Keep emerald/teal (`#26cb96`, matches existing favicon) as primary; add violet/purple as a secondary accent (charts, secondary states/badges) |
| Typography | Keep Geist Sans/Mono — no font change |
| Layout width philosophy | Content must be fluid and responsive across the full range from mobile to ultra-wide monitors — no narrow fixed-width columns floating in empty space. Grids gain columns as width grows; a generous max-width caps only extreme ultra-wide cases so text doesn't stretch unreadably wide |

## Design tokens (`src/app/globals.css`)

Currently `:root` and `.dark` are byte-for-byte identical (the app is hardcoded dark-only via `className="dark"` on `<html>` in `src/app/layout.tsx`). Both blocks need real, distinct values:

- **Light mode:** warm off-white background (not pure white), white cards with a soft low-opacity shadow, warm near-black text, subtle warm-gray borders.
- **Dark mode:** warm charcoal background (not nearly-pure-black as today), cards one step lighter than the background with a soft shadow for elevation (today's dark theme uses a border only, no shadow), near-white text.
- **Primary accent:** keep the current emerald (`--primary: oklch(0.75 0.15 165)` family) for both themes, retuned per-theme for contrast (light mode needs a slightly deeper emerald against a light card than dark mode does).
- **Secondary accent:** new violet/purple token (`--secondary-accent` or similar, distinct from the existing neutral `--secondary`) for chart series, badges, and secondary emphasis — never competing with the primary emerald for the same role.
- **Radius:** increase the base `--radius` so cards read as `rounded-2xl` and buttons/inputs as `rounded-xl` (today's `--radius: 0.625rem` yields a smaller `rounded-xl` feel across the board).
- **Shadow:** introduce a card-elevation shadow token (doesn't exist today — `Card` currently uses `ring-1 ring-foreground/10` with no shadow), tuned separately for light vs dark so it doesn't look muddy on dark backgrounds.

## Layout architecture

### Sidebar shell + route group

Today: `src/app/app/layout.tsx` renders a top navbar (logo, Contatos/Funil/Minha conta links, sign-out) and wraps only `/app`, `/app/contacts`, `/app/deals`. `/account` (`src/app/account/page.tsx`) has no shared layout — just a standalone "← Voltar" link, inconsistent with the rest of the authenticated app.

New: introduce a Next.js route group (verified supported in this Next.js version via `node_modules/next/dist/docs/.../route-groups.md`) so `/app/*` and `/account` share one authenticated shell without changing their URLs:

```
src/app/(shell)/
  layout.tsx        # new: sidebar + responsive content area
  app/
    page.tsx        # moved from src/app/app/page.tsx
    contacts/page.tsx
    deals/page.tsx
  account/
    page.tsx        # moved from src/app/account/page.tsx
```

`(shell)/layout.tsx` renders:
- A fixed-width left sidebar (logo, nav links to Dashboard/Contatos/Negociações, theme toggle, Conta + Sair at the bottom) — collapses into a drawer triggered by a hamburger button on mobile widths.
- A content area that fills the remaining width (`flex-1`), with responsive padding and a generous (not narrow) max-width only to keep body text/readable content from stretching unreasonably wide on ultra-wide monitors — nothing like today's `max-w-2xl` on the account page.

Landing page (`src/app/page.tsx`) and auth pages (`login`/`signup`/`forgot-password`/`reset-password`) are **not** part of the sidebar shell — they keep their own layouts (marketing nav for the landing page; centered card for auth), restyled with the new tokens but structurally as they are today.

### Theme toggle

- Remove the hardcoded `className="dark"` from `<html>` in `src/app/layout.tsx`.
- Add a theme provider so pages can render in light or dark mode. Preferred implementation: the `next-themes` package (handles system-preference detection, persistence, and no-flash-on-load). If it has any friction with this project's React 19.2.8 / Next.js 16.3.3 combination, fall back to a small custom implementation (a cookie or `localStorage` value read in a client wrapper, toggling a `data-theme`/`dark` class on `<html>`) — functionally equivalent, just hand-rolled.
- A `ThemeToggle` component (sun/moon icon button) lives in the sidebar (authenticated shell) and in the landing/auth pages' header, so the choice is available everywhere, not just inside the app.

## Page-by-page treatment

- **Landing** (`src/components/landing/{Nav,Hero,Features,Footer}.tsx`): restyled with new tokens/radius/shadow; hero uses full available width on large screens rather than a narrow centered block.
- **Auth pages** (login/signup/forgot-password/reset-password, `MotionCard`): keep the centered-card pattern (correct pattern for auth), restyled with new tokens; more breathing room around the card on large screens instead of it looking stranded.
- **Dashboard** (`src/app/(shell)/app/page.tsx`): stat card grids become fluid (`grid-cols-1` → up to 4-5 columns as width grows, via responsive Tailwind breakpoints rather than a fixed cap), funnel-by-stage stats pick up the secondary (violet) accent to visually separate "count" from "value" framing.
- **Contacts** (`ContactList`, `ContactItem`): list becomes a responsive card grid (1 column on mobile, 2-3 on wide screens) instead of always a single stacked column.
- **Deals/Kanban** (`DealBoard`, `DealCard`): the 5 stage columns use full available width on desktop instead of being width-capped; horizontal scroll behavior on narrow/mobile viewports is preserved.
- **Account** (`(shell)/account/page.tsx`): drops the `max-w-2xl` cap; the three settings sections (Foto, Email, Senha) reflow into two columns on large screens, one column on mobile.

## Components requiring changes

- `src/app/globals.css` — token overhaul described above.
- `src/app/layout.tsx` — remove hardcoded `dark` class, wrap in theme provider.
- New: `src/components/theme/ThemeToggle.tsx` (and a provider component if `next-themes` needs one wired into the root layout).
- New: `src/app/(shell)/layout.tsx` (sidebar + responsive shell), replacing `src/app/app/layout.tsx`.
- Moved (not logically changed): `src/app/app/page.tsx`, `src/app/app/contacts/page.tsx`, `src/app/app/deals/page.tsx`, `src/app/account/page.tsx` into the `(shell)` group.
- Restyled only (no logic changes): `Card`, `Button`, `Input`, `Select`, `Textarea`, `MotionCard`, `StatCard`, `ContactList`, `ContactItem`, `DealBoard`, `DealCard`, `ContactForm`, `DealForm`, `AvatarUploader`, `ChangeEmailForm`, `ChangePasswordForm`, landing components, auth page components.
- `src/components/ui/delete-confirm.tsx` — restyled only; the extraction from the earlier review makes this a single place to update instead of two.

## Risks / things to verify during implementation

- Confirm route groups behave as expected in this project's Next.js 16.3.3 build (check `node_modules/next/dist/docs/` per `AGENTS.md`, don't assume from training data).
- Confirm `next-themes` (or whatever theme mechanism is chosen) doesn't clash with Better Auth's session cookie handling or `src/proxy.ts` — it shouldn't, since it's purely client-side/cookie-for-theme, but worth a quick check given how much proxy/auth work happened in this project already.
- `@base-ui/react` (`base-nova` shadcn style, not Radix) has no `asChild` — any new sidebar nav-link-as-button styling must use `buttonVariants()` like the rest of the codebase already does.
- Moving pages into a route group changes file paths but not URLs — double check `revalidatePath` calls in `src/app/app/contacts/actions.ts` / `src/app/app/deals/actions.ts` still target the right paths (`/app`, `/app/contacts`, `/app/deals`) since revalidatePath operates on URL paths, not file paths, so these should be unaffected — but verify after the move.

## Testing / verification

No new unit tests — this is a visual/structural change with no new business logic. Verification is:
1. `npx vitest run`, `npx tsc --noEmit`, `npx eslint`, `npx next build` must all stay clean after the move/restyle (route group moves are a common source of stray import-path breakage).
2. Manual browser verification (via the `frontend-ui-ux` agent) of every page in **both themes** at **mobile, tablet, and desktop** widths: landing, login, signup, forgot-password, reset-password, dashboard, contacts (empty + populated), deals kanban (empty + populated), account.
3. Confirm existing interactive flows still work after restyling: create/edit/delete contact, create/edit/delete/move deal, theme toggle persists across reload, sidebar collapses to a drawer on mobile.

## Execution approach

Implementation should be delegated to the `frontend-ui-ux` subagent (created earlier in this project specifically for this kind of work), broken into tasks via the normal plan → subagent-driven-development flow, roughly in this order (later tasks depend on earlier ones):

1. Design tokens (`globals.css`) — light + dark palettes, radius, shadow.
2. Theme provider + `ThemeToggle` component; remove hardcoded `dark` class.
3. `(shell)` route group + sidebar layout; move `/app/*` and `/account` pages into it.
4. Restyle shared UI primitives (`Card`, `Button`, `Input`, `Select`, `Textarea`, `MotionCard`, `StatCard`, `delete-confirm`).
5. Dashboard page treatment (fluid grid, secondary accent in funnel stats).
6. Contacts page treatment (responsive card grid).
7. Deals/Kanban page treatment (full-width columns on desktop).
8. Account page treatment (two-column settings on large screens).
9. Landing page + auth pages restyle.
10. Full cross-page, cross-theme, cross-breakpoint verification pass.

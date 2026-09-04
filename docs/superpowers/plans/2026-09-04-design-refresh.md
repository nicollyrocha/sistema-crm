# Design Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Every task in this plan is frontend/UI work — dispatch it to the `frontend-ui-ux` subagent (see `.claude/agents/frontend-ui-ux.md`) rather than a generic one.

**Goal:** Give the whole system (landing, auth, dashboard, contacts, deals, account) a cohesive "soft SaaS" (Notion/Attio-inspired) visual identity — light+dark themes, a sidebar app shell, and fluid full-width-aware layouts — with zero changes to business logic.

**Architecture:** All color/radius/shadow values move to CSS custom properties in `src/app/globals.css` (already the pattern here) so most components restyle for free; a small hand-rolled theme system (no new dependency) toggles a `.dark` class on `<html>`; `/app/*` and `/account` move into a Next.js route group sharing one new sidebar layout, replacing the old top navbar.

**Tech Stack:** Next.js 16.3.3 App Router, Tailwind v4, shadcn/ui (`base-nova` / `@base-ui/react`), lucide-react (already installed), Framer Motion.

**Reference:** Design spec at `docs/superpowers/specs/2026-09-04-design-refresh-design.md`.

---

## Task 1: Design tokens — light/dark palette, radius, shadow, `surface-card` utility

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace the `@theme inline` block to add the new secondary-accent tokens**

In `src/app/globals.css`, find this block (currently lines 7-49):

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
```

Add these two lines immediately after `--color-foreground: var(--foreground);`:

```css
  --color-secondary-accent: var(--secondary-accent);
  --color-secondary-accent-foreground: var(--secondary-accent-foreground);
```

- [ ] **Step 2: Replace the entire `:root` block** (currently lines 51-85) with the new light-theme palette:

```css
:root {
  /* Sistema CRM — warm "soft SaaS" palette (light). */
  --background: oklch(0.98 0.006 85);
  --foreground: oklch(0.2 0.012 60);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.2 0.012 60);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.2 0.012 60);
  --primary: oklch(0.58 0.15 165);
  --primary-foreground: oklch(0.98 0.01 165);
  --secondary: oklch(0.94 0.008 85);
  --secondary-foreground: oklch(0.25 0.012 60);
  --muted: oklch(0.95 0.006 85);
  --muted-foreground: oklch(0.5 0.012 60);
  --accent: oklch(0.92 0.03 165);
  --accent-foreground: oklch(0.22 0.03 165);
  --secondary-accent: oklch(0.55 0.18 295);
  --secondary-accent-foreground: oklch(0.98 0.01 295);
  --destructive: oklch(0.58 0.21 25);
  --border: oklch(0.15 0 0 / 10%);
  --input: oklch(0.15 0 0 / 12%);
  --ring: oklch(0.58 0.15 165);
  --chart-1: oklch(0.58 0.15 165);
  --chart-2: oklch(0.55 0.18 295);
  --chart-3: oklch(0.55 0.14 230);
  --chart-4: oklch(0.7 0.15 80);
  --chart-5: oklch(0.6 0.18 20);
  --radius: 0.75rem;
  --shadow-card: 0 1px 2px oklch(0 0 0 / 6%), 0 8px 20px oklch(0 0 0 / 6%);
  --sidebar: oklch(0.99 0.006 85);
  --sidebar-foreground: oklch(0.2 0.012 60);
  --sidebar-primary: oklch(0.58 0.15 165);
  --sidebar-primary-foreground: oklch(0.98 0.01 165);
  --sidebar-accent: oklch(0.93 0.02 165);
  --sidebar-accent-foreground: oklch(0.22 0.03 165);
  --sidebar-border: oklch(0.15 0 0 / 8%);
  --sidebar-ring: oklch(0.58 0.15 165);
}
```

- [ ] **Step 3: Replace the entire `.dark` block** (currently lines 87-119) with the new dark-theme palette:

```css
.dark {
  /* Sistema CRM — warm "soft SaaS" palette (dark). */
  --background: oklch(0.19 0.006 60);
  --foreground: oklch(0.96 0.004 80);
  --card: oklch(0.24 0.008 60);
  --card-foreground: oklch(0.96 0.004 80);
  --popover: oklch(0.24 0.008 60);
  --popover-foreground: oklch(0.96 0.004 80);
  --primary: oklch(0.78 0.16 165);
  --primary-foreground: oklch(0.15 0.02 165);
  --secondary: oklch(0.28 0.01 60);
  --secondary-foreground: oklch(0.96 0.004 80);
  --muted: oklch(0.26 0.006 60);
  --muted-foreground: oklch(0.68 0.01 60);
  --accent: oklch(0.3 0.05 165);
  --accent-foreground: oklch(0.96 0.004 80);
  --secondary-accent: oklch(0.72 0.16 295);
  --secondary-accent-foreground: oklch(0.15 0.02 295);
  --destructive: oklch(0.68 0.19 25);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 14%);
  --ring: oklch(0.78 0.16 165);
  --chart-1: oklch(0.78 0.16 165);
  --chart-2: oklch(0.72 0.16 295);
  --chart-3: oklch(0.7 0.14 230);
  --chart-4: oklch(0.78 0.15 80);
  --chart-5: oklch(0.7 0.18 20);
  --shadow-card: 0 1px 2px oklch(0 0 0 / 30%), 0 8px 24px oklch(0 0 0 / 35%);
  --sidebar: oklch(0.16 0.006 60);
  --sidebar-foreground: oklch(0.96 0.004 80);
  --sidebar-primary: oklch(0.78 0.16 165);
  --sidebar-primary-foreground: oklch(0.15 0.02 165);
  --sidebar-accent: oklch(0.3 0.05 165);
  --sidebar-accent-foreground: oklch(0.96 0.004 80);
  --sidebar-border: oklch(1 0 0 / 8%);
  --sidebar-ring: oklch(0.78 0.16 165);
}
```

- [ ] **Step 4: Add a `surface-card` utility** so the repeated `rounded-xl border border-border bg-card` pattern (found identically in 6 files) becomes one maintainable class. Add this after the `@layer base { ... }` block at the end of the file:

```css
@utility surface-card {
  border-radius: var(--radius-2xl);
  border-width: 1px;
  border-color: var(--border);
  background-color: var(--card);
  box-shadow: var(--shadow-card);
}
```

- [ ] **Step 5: Verify the build picks up the new tokens**

Run: `npx next build`
Expected: build succeeds with no CSS errors (Tailwind v4 resolves `@utility` and the new `--color-secondary-accent*` mappings at build time — a typo here fails the build immediately).

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add light/dark design tokens and surface-card utility"
```

---

## Task 2: Theme system (no new dependency) — provider, toggle, no-flash script

**Files:**
- Create: `src/lib/theme.ts`
- Create: `src/components/theme/ThemeProvider.tsx`
- Create: `src/components/theme/ThemeToggle.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create the theme storage/detection helpers**

Create `src/lib/theme.ts`:

```ts
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "sistema-crm-theme";

export function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}
```

- [ ] **Step 2: Create the theme provider/context**

Create `src/components/theme/ThemeProvider.tsx`:

```tsx
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { applyTheme, getStoredTheme, getSystemTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme() ?? getSystemTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function setTheme(next: Theme) {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    setThemeState(next);
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
```

- [ ] **Step 3: Create the toggle button**

Create `src/components/theme/ThemeToggle.tsx`:

```tsx
"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
```

- [ ] **Step 4: Wire the provider into the root layout and remove the hardcoded dark class**

Read `src/app/layout.tsx` first to confirm it still matches this plan's assumption (it was last touched for the favicon change, not layout structure). Replace its full contents with:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema CRM",
  description: "Gerencie seus clientes e seu funil de vendas em um só lugar.",
};

const NO_FLASH_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

This removes the `dark` class that was previously hardcoded onto `<html>` (which forced dark mode always) and instead sets it via an inline script that runs before paint (avoiding a flash of the wrong theme), plus `ThemeProvider` keeps it in sync after any user toggle.

- [ ] **Step 5: Verify no hydration/build errors**

Run: `npx next build`
Expected: build succeeds. (A hydration mismatch would show as a runtime warning, not a build failure — the manual browser check in Task 10 confirms this concretely.)

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/theme.ts src/components/theme/ThemeProvider.tsx src/components/theme/ThemeToggle.tsx src/app/layout.tsx
git commit -m "feat: add light/dark theme system with no-flash script"
```

---

## Task 3: Sidebar app shell — route group, move pages, new layout

**Files:**
- Create: `src/components/shell/AppSidebar.tsx`
- Create: `src/app/(shell)/layout.tsx`
- Move: `src/app/app/page.tsx` → `src/app/(shell)/app/page.tsx`
- Move: `src/app/app/dashboard-data.ts` → `src/app/(shell)/app/dashboard-data.ts`
- Move: `src/app/app/contacts/page.tsx` → `src/app/(shell)/app/contacts/page.tsx`
- Move: `src/app/app/contacts/actions.ts` → `src/app/(shell)/app/contacts/actions.ts`
- Move: `src/app/app/deals/page.tsx` → `src/app/(shell)/app/deals/page.tsx`
- Move: `src/app/app/deals/actions.ts` → `src/app/(shell)/app/deals/actions.ts`
- Move: `src/app/account/page.tsx` → `src/app/(shell)/account/page.tsx` (content also rewritten — see Step 5)
- Delete: `src/app/app/layout.tsx`

- [ ] **Step 1: Confirm the move is safe (no relative imports crossing directory boundaries)**

Run: `grep -n "from \"\\./" src/app/app/page.tsx src/app/app/dashboard-data.ts src/app/app/contacts/page.tsx src/app/app/contacts/actions.ts src/app/app/deals/page.tsx src/app/app/deals/actions.ts src/app/account/page.tsx`

Expected: any matches are relative imports to a sibling in the *same* subfolder (e.g. `contacts/page.tsx` importing `./actions` or `./ContactForm` — fine, since the whole `contacts/` folder moves together). If any match points `../` outside the folder being moved, note it and adjust the corresponding step below before proceeding.

- [ ] **Step 2: Move the files** (Next.js route groups — folders wrapped in parentheses — don't affect the URL, so `/app` and `/account` keep their exact URLs; verified against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route-groups.md`)

```bash
mkdir -p "src/app/(shell)/app/contacts" "src/app/(shell)/app/deals" "src/app/(shell)/account"
git mv src/app/app/page.tsx "src/app/(shell)/app/page.tsx"
git mv src/app/app/dashboard-data.ts "src/app/(shell)/app/dashboard-data.ts"
git mv src/app/app/contacts/page.tsx "src/app/(shell)/app/contacts/page.tsx"
git mv src/app/app/contacts/actions.ts "src/app/(shell)/app/contacts/actions.ts"
git mv src/app/app/deals/page.tsx "src/app/(shell)/app/deals/page.tsx"
git mv src/app/app/deals/actions.ts "src/app/(shell)/app/deals/actions.ts"
git mv src/app/account/page.tsx "src/app/(shell)/account/page.tsx"
git rm src/app/app/layout.tsx
```

- [ ] **Step 3: Create the sidebar component**

Create `src/components/shell/AppSidebar.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, Users, Handshake, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SignOutButton } from "@/components/auth/SignOutButton";

const NAV_LINKS = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/contacts", label: "Contatos", icon: Users },
  { href: "/app/deals", label: "Negociações", icon: Handshake },
  { href: "/account", label: "Conta", icon: UserCircle },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/app" ? pathname === "/app" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 md:hidden">
        <Link href="/app" className="text-base font-semibold text-sidebar-foreground">
          Sistema CRM
        </Link>
        <button
          type="button"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </header>

      {mobileOpen && (
        <div className="border-b border-sidebar-border bg-sidebar px-4 pb-4 md:hidden">
          <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <div className="mt-4 flex items-center justify-between border-t border-sidebar-border pt-4">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      )}

      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
        <Link href="/app" className="mb-6 px-1 text-base font-semibold text-sidebar-foreground">
          Sistema CRM
        </Link>
        <NavLinks pathname={pathname} />
        <div className="mt-auto flex items-center justify-between border-t border-sidebar-border pt-4">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}
```

- [ ] **Step 4: Create the shell layout**

Create `src/app/(shell)/layout.tsx`:

```tsx
import { AppSidebar } from "@/components/shell/AppSidebar";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppSidebar />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-[1600px]">{children}</div>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Rewrite the moved account page** (drops the old standalone "← Voltar" header and the narrow `max-w-2xl` wrapper — the sidebar now provides navigation and the shell layout provides the responsive width)

Replace the full contents of `src/app/(shell)/account/page.tsx` with:

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AvatarUploader } from "@/components/account/AvatarUploader";
import { ChangeEmailForm } from "@/components/account/ChangeEmailForm";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  const user = session.user;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Minha conta</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-6">
          <h2 className="mb-4 text-lg font-medium">Foto de perfil</h2>
          <AvatarUploader currentImage={user.image} name={user.name} />
        </section>

        <section className="surface-card p-6">
          <h2 className="mb-4 text-lg font-medium">Email</h2>
          <ChangeEmailForm currentEmail={user.email} />
        </section>

        <section className="surface-card p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-medium">Senha</h2>
          <ChangePasswordForm />
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify routing and revalidation paths still work**

Run: `grep -rn "revalidatePath" "src/app/(shell)/app"`
Expected: `revalidatePath("/app")`, `revalidatePath("/app/contacts")`, `revalidatePath("/app/deals")` calls unchanged — `revalidatePath` operates on URL paths, which the route group does not alter, so no edits needed here. Just confirm the calls are still present and unchanged.

Run: `npx tsc --noEmit`
Expected: no errors (confirms every `@/...` import inside the moved files still resolves — they were absolute imports, not relative, so the move shouldn't break anything, but this is the concrete check).

Run: `npx next build`
Expected: build output lists `/app`, `/app/contacts`, `/app/deals`, `/account` as routes (same URLs as before the move — Turbopack's route listing table printed at the end of the build makes this visible).

- [ ] **Step 7: Commit**

```bash
git add -A src/app src/components/shell
git commit -m "feat: move app/account into a sidebar shell layout"
```

---

## Task 4: Apply `surface-card` and secondary-accent styling to shared components

**Files:**
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/dashboard/StatCard.tsx`
- Modify: `src/components/contacts/ContactItem.tsx`
- Modify: `src/components/deals/DealCard.tsx`
- Modify: `src/components/contacts/ContactList.tsx`
- Modify: `src/components/deals/DealBoard.tsx`

- [ ] **Step 0: Update the (currently unused, but part of the shared UI kit) `Card` primitive** to match the new surface style, so any future use of it automatically matches the rest of the app.

In `src/components/ui/card.tsx`, replace:

```tsx
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
```

with:

```tsx
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-2xl bg-card py-(--card-spacing) text-sm text-card-foreground shadow-[var(--shadow-card)] [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-2xl *:[img:last-child]:rounded-b-2xl",
```

(This swaps the `ring-1 ring-foreground/10` outline for the same soft `shadow-[var(--shadow-card)]` used everywhere else, and bumps the corner radius to match.)

- [ ] **Step 1: Update `StatCard` to use `surface-card` and support a secondary-accent variant**

Replace the full contents of `src/components/dashboard/StatCard.tsx`:

```tsx
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sublabel,
  accent = "primary",
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: "primary" | "secondary";
}) {
  return (
    <div className="surface-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold", accent === "secondary" && "text-secondary-accent")}>
        {value}
      </p>
      {sublabel && <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Restyle `ContactItem` as a stackable grid card** (was a wide row with actions pinned to the right; needs to read well at grid-column width once `ContactList` becomes a grid in Task 6)

In `src/components/contacts/ContactItem.tsx`, replace the editing-mode return block:

```tsx
  if (editing) {
    return (
      <li className="rounded-xl border border-border bg-card p-4">
```

with:

```tsx
  if (editing) {
    return (
      <li className="surface-card p-4">
```

Then replace the non-editing return block (from `return (` through the closing `);` right before the final `}`):

```tsx
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 break-words font-medium">{contact.name}</p>
          <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
            {STATUS_LABELS[contact.status] ?? contact.status}
          </span>
        </div>
        <div className="mt-1 flex flex-col gap-0.5 break-words text-sm text-muted-foreground">
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <span>{contact.phone}</span>}
          {contact.company && <span>{contact.company}</span>}
        </div>
        {contact.notes && <p className="mt-2 break-words text-sm text-muted-foreground">{contact.notes}</p>}
        {deleteError && <p className="mt-2 text-sm text-destructive">{deleteError}</p>}
      </div>
      <div className="flex shrink-0 gap-1">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          Editar
        </Button>
        <DeleteConfirmButtons
          confirming={confirmingDelete}
          deleting={deleting}
          onRequest={requestDelete}
          onConfirm={handleDelete}
          onCancel={cancelDelete}
        />
      </div>
    </motion.li>
  );
}
```

with:

```tsx
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="surface-card flex flex-col gap-3 p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 break-words font-medium">{contact.name}</p>
        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
          {STATUS_LABELS[contact.status] ?? contact.status}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 break-words text-sm text-muted-foreground">
        {contact.email && <span>{contact.email}</span>}
        {contact.phone && <span>{contact.phone}</span>}
        {contact.company && <span>{contact.company}</span>}
      </div>
      {contact.notes && <p className="break-words text-sm text-muted-foreground">{contact.notes}</p>}
      {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
      <div className="mt-auto flex gap-1 pt-1">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          Editar
        </Button>
        <DeleteConfirmButtons
          confirming={confirmingDelete}
          deleting={deleting}
          onRequest={requestDelete}
          onConfirm={handleDelete}
          onCancel={cancelDelete}
        />
      </div>
    </motion.li>
  );
}
```

- [ ] **Step 3: Update `DealCard`'s surfaces** (its layout is already vertical/stacked — only the class name changes, no structural change needed)

In `src/components/deals/DealCard.tsx`, replace:

```tsx
      <li className="rounded-xl border border-border bg-card p-4">
```

with:

```tsx
      <li className="surface-card p-4">
```

And replace:

```tsx
      className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
```

with:

```tsx
      className="surface-card flex flex-col gap-2 p-4"
```

- [ ] **Step 4: Turn `ContactList`'s list into a responsive grid**

In `src/components/contacts/ContactList.tsx`, replace:

```tsx
      <div className="rounded-xl border border-border bg-card p-4">
        <ContactForm key={formResetKey} submitLabel="Adicionar contato" onSubmit={handleCreate} />
      </div>
```

with:

```tsx
      <div className="surface-card p-4">
        <ContactForm key={formResetKey} submitLabel="Adicionar contato" onSubmit={handleCreate} />
      </div>
```

And replace:

```tsx
        <ul className="flex flex-col gap-3">
```

with:

```tsx
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
```

- [ ] **Step 5: Update `DealBoard`'s surfaces and make the kanban columns fill the width on desktop**

In `src/components/deals/DealBoard.tsx`, replace:

```tsx
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
```

with:

```tsx
        <div className="surface-card p-4 text-sm text-muted-foreground">
```

Replace:

```tsx
        <div className="rounded-xl border border-border bg-card p-4">
          <DealForm
```

with:

```tsx
        <div className="surface-card p-4">
          <DealForm
```

Replace:

```tsx
      <div className="flex gap-4 overflow-x-auto pb-2">
```

with:

```tsx
      <div className="flex gap-4 overflow-x-auto pb-2 xl:grid xl:grid-cols-5 xl:overflow-visible">
```

Replace:

```tsx
            <div key={stageDef.value} className="flex w-72 shrink-0 flex-col gap-3">
```

with:

```tsx
            <div key={stageDef.value} className="flex w-72 shrink-0 flex-col gap-3 xl:w-auto xl:shrink">
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npx eslint`
Expected: no errors.

Run: `npx vitest run`
Expected: all existing tests still pass (this task touches no logic, only JSX/className).

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/card.tsx src/components/dashboard/StatCard.tsx src/components/contacts/ContactItem.tsx src/components/deals/DealCard.tsx src/components/contacts/ContactList.tsx src/components/deals/DealBoard.tsx
git commit -m "style: apply surface-card token and responsive grids to contacts/deals/dashboard"
```

---

## Task 5: Dashboard secondary-accent + account restyle verification

**Files:**
- Modify: `src/app/(shell)/app/page.tsx`

- [ ] **Step 1: Give the "Negociações abertas" stat the secondary accent**, so the count-oriented headline metric reads visually distinct from the money-oriented "Valor em aberto" one, per the design spec.

In `src/app/(shell)/app/page.tsx`, replace:

```tsx
          <StatCard label="Negociações abertas" value={String(dealStats.openCount)} />
```

with:

```tsx
          <StatCard label="Negociações abertas" value={String(dealStats.openCount)} accent="secondary" />
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors (confirms the new `accent` prop from Task 4 Step 1 is accepted here).

- [ ] **Step 3: Commit**

```bash
git add "src/app/(shell)/app/page.tsx"
git commit -m "style: highlight open-deals count with the secondary accent"
```

---

## Task 6: Landing page — fluid width and theme toggle access

**Files:**
- Modify: `src/components/landing/Nav.tsx`
- Modify: `src/components/landing/Hero.tsx`
- Modify: `src/components/landing/Features.tsx`
- Modify: `src/components/landing/Footer.tsx`

- [ ] **Step 1: Widen the landing page's containers and add the theme toggle to its nav**

Replace the full contents of `src/components/landing/Nav.tsx`:

```tsx
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function Nav() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-12">
      <span className="text-lg font-semibold">Sistema CRM</span>
      <nav className="flex items-center gap-3">
        <ThemeToggle />
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
          Entrar
        </Link>
        <Link href="/signup" className={buttonVariants({ size: "sm" })}>
          Criar conta grátis
        </Link>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Widen the hero section**

In `src/components/landing/Hero.tsx`, replace:

```tsx
    <section className="mx-auto max-w-5xl px-6 py-24 text-center">
```

with:

```tsx
    <section className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-12">
```

- [ ] **Step 3: Widen the features grid and give it a fourth breakpoint for large screens**

In `src/components/landing/Features.tsx`, replace:

```tsx
    <section className="mx-auto grid max-w-5xl gap-6 px-6 py-16 sm:grid-cols-3">
```

with:

```tsx
    <section className="mx-auto grid max-w-7xl gap-6 px-6 py-16 sm:grid-cols-3 lg:px-12">
```

And replace:

```tsx
        <div key={feature.title} className="rounded-2xl border border-border bg-card p-6">
```

with:

```tsx
        <div key={feature.title} className="surface-card p-6">
```

- [ ] **Step 4: Widen the footer**

In `src/components/landing/Footer.tsx`, replace:

```tsx
    <footer className="mx-auto max-w-5xl px-6 py-10 text-center text-sm text-muted-foreground">
```

with:

```tsx
    <footer className="mx-auto max-w-7xl px-6 py-10 text-center text-sm text-muted-foreground lg:px-12">
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npx eslint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/landing
git commit -m "style: widen landing page containers, add theme toggle"
```

---

## Task 7: Auth pages restyle (login/signup/forgot-password/reset-password)

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/signup/page.tsx`
- Modify: `src/app/forgot-password/page.tsx`
- Modify: `src/app/reset-password/page.tsx`

- [ ] **Step 1: Give the auth pages more visual composition around the card and a theme toggle**, instead of the card looking stranded alone in the center — add a subtle top bar with a home link and the toggle, and let the surrounding `<main>` use the new token colors.

All four files share the exact same wrapper structure. In **each** of `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/forgot-password/page.tsx`, `src/app/reset-password/page.tsx`, replace:

```tsx
    <main className="flex min-h-screen items-center justify-center p-6">
```

with:

```tsx
    <main className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between p-6">
        <Link href="/" className="text-sm font-semibold">
          Sistema CRM
        </Link>
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
```

Each of the four files closes with `</MotionCard>` immediately followed by `</main>` (the `MotionCard` is `<main>`'s only direct child in all four). Replace:

```tsx
    </main>
  );
}
```

with:

```tsx
      </div>
    </main>
  );
}
```

Also add this import to all four files (each already imports `Link` from `next/link` — confirm and add the `ThemeToggle` import alongside it):

```tsx
import { ThemeToggle } from "@/components/theme/ThemeToggle";
```

- [ ] **Step 2: Update the `MotionCard` className** in all four files. Replace:

```tsx
      <MotionCard className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
```

with:

```tsx
      <MotionCard className="surface-card w-full max-w-sm p-8">
```

- [ ] **Step 3: Verify each of the four pages still renders** — run the build, which type-checks all four:

Run: `npx tsc --noEmit && npx eslint`
Expected: no errors. If a file didn't already import `Link` (double-check `forgot-password/page.tsx` and `reset-password/page.tsx` specifically), add `import Link from "next/link";` to it.

- [ ] **Step 4: Commit**

```bash
git add src/app/login/page.tsx src/app/signup/page.tsx src/app/forgot-password/page.tsx src/app/reset-password/page.tsx
git commit -m "style: restyle auth pages with new tokens and a theme toggle"
```

---

## Task 8: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the automated checks**

```bash
npx vitest run
npx tsc --noEmit
npx eslint
npx next build
```

Expected: all four succeed with no errors. The build's route table should still list exactly `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/app`, `/app/contacts`, `/app/deals`, `/account`, `/icon.svg`, plus the existing API routes — same URLs as before Task 3's move.

- [ ] **Step 2: Manual browser verification** (use the `frontend-ui-ux` agent's standard verification workflow: start the dev server, check console/network errors, screenshot)

For **both** light and dark theme (use the sidebar/landing `ThemeToggle`), and at **mobile (375px)**, **tablet (768px)**, and **desktop (1440px+)** widths, check:

- `/` — landing page renders, theme toggle works, no console errors.
- `/login`, `/signup`, `/forgot-password`, `/reset-password` — card renders centered with the new styling, theme toggle works.
- `/app` — dashboard stat grids reflow correctly at each width; "Negociações abertas" shows in the secondary (violet) accent color.
- `/app/contacts` — contact cards form a responsive grid (1 col mobile → up to 3 cols desktop); create/edit/delete still work; delete confirmation (Excluir → Confirmar/Cancelar) still works.
- `/app/deals` — kanban columns scroll horizontally on mobile/tablet and fill full width as a 5-column grid at `xl` (1280px+); create/edit/delete/stage-change still work.
- `/account` — two-column layout on large screens, one column on mobile; avatar upload, email change, password change forms still work.
- Sidebar: nav links show the active-page highlight; mobile hamburger opens/closes the drawer; theme toggle and sign-out are reachable from both the desktop sidebar and the mobile drawer.
- Reload any page after toggling the theme — confirm the choice persists (no flash back to the old theme).

Fix any issue found by reading the relevant file from this plan's tasks and correcting it, then re-run Step 1's checks.

- [ ] **Step 3: Final commit** (only if Step 2 required fixes; otherwise this task produces no diff)

```bash
git add -A
git commit -m "fix: address issues found during design refresh verification pass"
```

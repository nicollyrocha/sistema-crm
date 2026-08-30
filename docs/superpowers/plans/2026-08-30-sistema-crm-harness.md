# Sistema CRM Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a full-stack CRM harness (Next.js + Neon + Better Auth on Vercel) with a complete auth/account system and a landing page, in a distinctive modern design. No CRM domain features yet — the authenticated area is a placeholder dashboard for future work.

**Architecture:** Next.js 16 App Router monolith. Server Components render pages; Better Auth owns all auth/session/account-credential logic and its own DB tables; Drizzle ORM is the data-access layer over Neon Postgres for Better Auth's tables. Route protection via Next.js middleware checking the Better Auth session cookie.

**Tech Stack:** Next.js 16 (TS, App Router), Tailwind CSS v4, shadcn/ui, Neon (Postgres) + Drizzle ORM/drizzle-kit, Better Auth (+ Drizzle adapter), Vercel Blob, Zod, Framer Motion, Resend (email), Vitest (unit tests).

**Testing approach note:** Server Actions/routes, auth wiring, and all UI are verified manually via the dev server in a browser (per-task verification steps below), since they depend on a live Postgres connection, cookies, and rendered layout that unit tests can't meaningfully substitute for. Vitest is set up for future pure-logic unit tests (e.g. validation schemas once CRM domain work begins).

**Note on Better Auth API shape:** Better Auth is Vercel's authentication product. The code below uses the confirmed-working API shape from the sibling `todo-list` harness (`betterAuth()`, `drizzleAdapter`, `toNextJsHandler`, `createAuthClient`, `getSessionCookie`, and the `emailVerification.sendVerificationEmail` hook for change-email confirmation — NOT `user.changeEmail.sendChangeEmailVerification`, which doesn't exist in the installed version). If `npm install better-auth` pulls a version where these exports have moved, check the package's current README/TypeScript types before improvising — don't guess at a different shape silently.

---

## File Structure

```
sistema-crm/
  drizzle.config.ts
  .env.local.example
  src/
    db/
      schema.ts
      index.ts
    lib/
      auth.ts
      auth-client.ts
      email.ts
    middleware.ts
    app/
      layout.tsx
      globals.css
      page.tsx                        (landing page)
      api/auth/[...all]/route.ts
      api/account/avatar/route.ts
      login/page.tsx
      signup/page.tsx
      forgot-password/page.tsx
      reset-password/page.tsx
      app/
        layout.tsx
        page.tsx                      (placeholder dashboard)
      account/
        page.tsx
    components/
      landing/Nav.tsx
      landing/Hero.tsx
      landing/Features.tsx
      landing/Footer.tsx
      auth/LoginForm.tsx
      auth/SignupForm.tsx
      auth/ForgotPasswordForm.tsx
      auth/ResetPasswordForm.tsx
      auth/SignOutButton.tsx
      account/ChangeEmailForm.tsx
      account/ChangePasswordForm.tsx
      account/AvatarUploader.tsx
  tests/
    smoke.test.ts
```

---

### Task 1: Project scaffold & tooling

**Files:**
- Create: entire Next.js project at `C:\Users\Nic\Documents\sistema-crm` via `create-next-app`
- Create: `.gitignore` (from template)

- [ ] **Step 1: Scaffold the Next.js app**

Run from `C:\Users\Nic\Documents\sistema-crm`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

Expected: project files created (`package.json`, `src/app/`, `tailwind` config/css, etc.), no prompts left unanswered.

- [ ] **Step 2: Verify the dev server runs**

Run: `npm run dev` (in background / separate terminal), then open `http://localhost:3000`.
Expected: default Next.js welcome page loads with no console errors. Stop the dev server after confirming.

- [ ] **Step 3: Init git and commit the scaffold**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js app"
```

Expected: commit succeeds; `git log` shows one commit.

---

### Task 2: Vitest setup

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/smoke.test.ts`
- Modify: `package.json` (add `test` script)

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest vite-tsconfig-paths
```

- [ ] **Step 2: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 3: Add the `test` script to `package.json`**

Add under `"scripts"`: `"test": "vitest run"`

- [ ] **Step 4: Write a smoke test**

`tests/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("test harness", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: 1 test file, 1 test, PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: add vitest"
```

---

### Task 3: Neon + Drizzle setup

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/index.ts`
- Create: `drizzle.config.ts`
- Create: `.env.local.example`

- [ ] **Step 1: Install dependencies**

```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

- [ ] **Step 2: Write the schema**

`src/db/schema.ts`:

```ts
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  issuer: text("issuer").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

Note: `account.issuer` is required by the installed Better Auth version (account identity is
scoped by issuer) — confirmed against the working sibling `todo-list` schema.

- [ ] **Step 3: Write the Drizzle client**

`src/db/index.ts`:

```ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```

- [ ] **Step 4: Write `drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 5: Write `.env.local.example`**

```
DATABASE_URL=postgresql://<user>:<password>@<neon-host>/<db>?sslmode=require
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
BLOB_READ_WRITE_TOKEN=
RESEND_API_KEY=
EMAIL_FROM=onboarding@resend.dev
```

- [ ] **Step 6: Create a Neon database and set the real `.env.local`**

Create a Neon project (via the Neon dashboard or `neonctl`), copy the pooled connection string
into a new `.env.local` (copy of `.env.local.example` with real values). This file is
user-provided and gitignored — do not commit it.

- [ ] **Step 7: Generate and run the initial migration**

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Expected: a SQL file appears under `drizzle/`, and `drizzle-kit migrate` reports the migration
applied with no errors (requires a valid `DATABASE_URL` in `.env.local` from Step 6).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Neon + Drizzle schema and migration"
```

---

### Task 4: Better Auth server + API route

**Files:**
- Create: `src/lib/email.ts`
- Create: `src/lib/auth.ts`
- Create: `src/lib/auth-client.ts`
- Create: `src/app/api/auth/[...all]/route.ts`

- [ ] **Step 1: Install dependencies**

```bash
npm install better-auth resend
```

- [ ] **Step 2: Write the email helper**

`src/lib/email.ts`:

```ts
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[email:dev] to=${to} subject=${subject}\n${html}`);
    return;
  }
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to,
    subject,
    html,
  });
}

export async function sendResetPasswordEmail(to: string, url: string) {
  await send(
    to,
    "Redefina sua senha",
    `<p>Clique no link para redefinir sua senha: <a href="${url}">${url}</a></p>`
  );
}

export async function sendChangeEmailVerification(to: string, url: string) {
  await send(
    to,
    "Confirme seu novo email",
    `<p>Clique no link para confirmar seu novo email: <a href="${url}">${url}</a></p>`
  );
}
```

- [ ] **Step 3: Write the Better Auth server config**

`src/lib/auth.ts`:

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { sendResetPasswordEmail, sendChangeEmailVerification } from "@/lib/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail(user.email, url);
    },
  },
  // Do NOT set requireEmailVerification: true or sendOnSignUp/sendOnSignIn without first
  // adding flow-detection here — this hook is shared with signup email verification, and
  // right now it only fires for the change-email flow.
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendChangeEmailVerification(user.email, url);
    },
  },
  user: {
    changeEmail: {
      enabled: true,
    },
  },
});
```

- [ ] **Step 4: Write the Better Auth client**

`src/lib/auth-client.ts`:

```ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
```

- [ ] **Step 5: Wire the API route handler**

`src/app/api/auth/[...all]/route.ts`:

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
```

- [ ] **Step 6: Set `BETTER_AUTH_SECRET`**

Generate a secret and add it to `.env.local`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the output as `BETTER_AUTH_SECRET` in `.env.local`.

- [ ] **Step 7: Manual verification — sign up via the API directly**

Run `npm run dev`, then in another terminal:

```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"name\":\"Test User\"}"
```

Expected: JSON response containing a `user` object; a corresponding row appears in the Neon
`user` table (check via `npx drizzle-kit studio` or the Neon SQL editor).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: configure Better Auth server, client, and API route"
```

---

### Task 5: Route protection middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Write the middleware**

`src/middleware.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PROTECTED_ROUTES = ["/app", "/account"];
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/app", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/account/:path*", "/login", "/signup", "/forgot-password", "/reset-password"],
};
```

- [ ] **Step 2: Manual verification**

Run `npm run dev`, visit `http://localhost:3000/app` in a browser with no session cookie.
Expected: redirected to `/login`. (`/login` doesn't exist yet — a 404 after redirect is fine at
this stage; the redirect itself is what's being verified. Check the URL bar shows `/login`.)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add auth route protection middleware"
```

---

### Task 6: Design system foundations

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Init shadcn/ui**

```bash
npx shadcn@latest init -d
```

Expected: `components.json` created, `src/components/ui/` directory created, `globals.css`
updated with shadcn's base layer.

- [ ] **Step 2: Add the primitives this project needs**

```bash
npx shadcn@latest add button input label card avatar
```

- [ ] **Step 3: Layer the custom visual identity on top of `globals.css`**

Edit `src/app/globals.css`, inside the `:root`/`.dark` (or `@theme`) block: set a dark-first
palette with an emerald/teal accent — distinct from the violet/cyan accent used by the sibling
`todo-list` project, so the two apps don't look identical. Example values: background near-black
(`oklch(0.14 0 0)`), foreground near-white, primary a vibrant teal (`oklch(0.75 0.15 175)`). Keep
the exact token names shadcn generated (`--background`, `--foreground`, `--primary`, etc.) — only
change their values, don't rename them.

- [ ] **Step 4: Set up fonts and base layout**

`src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema CRM",
  description: "Gerencie seus clientes e seu funil de vendas em um só lugar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Install Framer Motion**

```bash
npm install framer-motion
```

- [ ] **Step 6: Manual verification**

Run `npm run dev`, visit `http://localhost:3000`.
Expected: dark background with teal accent visible on default/shadcn elements, no console/hydration errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: set up design system foundations (shadcn, palette, fonts, framer-motion)"
```

---

### Task 7: Auth forms — Login & Signup

**Files:**
- Create: `src/components/auth/LoginForm.tsx`
- Create: `src/components/auth/SignupForm.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/app/signup/page.tsx`

- [ ] **Step 1: Write the login form**

`src/components/auth/LoginForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Não foi possível entrar.");
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Write the signup form**

`src/components/auth/SignupForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.signUp.email({ email, password, name });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Não foi possível criar a conta.");
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Criando conta..." : "Criar conta"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Write the pages**

`src/app/login/page.tsx`:

```tsx
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
        <h1 className="mb-6 text-2xl font-semibold">Entrar</h1>
        <LoginForm />
        <p className="mt-6 text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link href="/signup" className="text-primary underline">
            Criar conta
          </Link>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          <Link href="/forgot-password" className="text-primary underline">
            Esqueci minha senha
          </Link>
        </p>
      </div>
    </main>
  );
}
```

`src/app/signup/page.tsx`:

```tsx
import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
        <h1 className="mb-6 text-2xl font-semibold">Criar conta</h1>
        <SignupForm />
        <p className="mt-6 text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="text-primary underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Manual verification**

Run `npm run dev`. Visit `/signup`, create an account with a new email → expect redirect to
`/app` (404 is fine, page doesn't exist yet — but the URL must change to `/app`). Then visit
`/login` while that session is active → expect redirect back to `/app` (middleware's auth-route
guard). Open dev tools → Application → Cookies and confirm a `better-auth.session_token` cookie
is set.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add login and signup pages"
```

---

### Task 8: Auth forms — Forgot & Reset password

**Files:**
- Create: `src/components/auth/ForgotPasswordForm.tsx`
- Create: `src/components/auth/ResetPasswordForm.tsx`
- Create: `src/app/forgot-password/page.tsx`
- Create: `src/app/reset-password/page.tsx`

- [ ] **Step 1: Write the forgot-password form**

`src/components/auth/ForgotPasswordForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Não foi possível enviar o email.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return <p className="text-sm text-muted-foreground">Se esse email existir, enviamos um link de redefinição de senha.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar link de redefinição"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Write the reset-password form**

`src/components/auth/ResetPasswordForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Link inválido ou expirado.");
      return;
    }
    setError(null);
    setLoading(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Não foi possível redefinir a senha.");
      return;
    }
    router.push("/login");
  }

  if (!token) {
    return <p className="text-sm text-destructive">Link inválido ou expirado. Solicite um novo em &quot;Esqueci minha senha&quot;.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Redefinir senha"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Write the pages**

`src/app/forgot-password/page.tsx`:

```tsx
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
        <h1 className="mb-6 text-2xl font-semibold">Esqueci minha senha</h1>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
```

`src/app/reset-password/page.tsx`:

```tsx
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
        <h1 className="mb-6 text-2xl font-semibold">Redefinir senha</h1>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Manual verification**

Run `npm run dev`, log out (or use an incognito window), visit `/forgot-password`, submit the
email used in Task 7. Check the dev server terminal for the `[email:dev]` log line (no
`RESEND_API_KEY` configured yet), copy the reset URL from it, open it in the browser → should
land on `/reset-password?token=...`. Submit a new password → expect redirect to `/login`. Log in
with the new password → expect success.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add forgot-password and reset-password pages"
```

---

### Task 9: Placeholder dashboard (`/app`) + sign-out

**Files:**
- Create: `src/components/auth/SignOutButton.tsx`
- Create: `src/app/app/layout.tsx`
- Create: `src/app/app/page.tsx`

- [ ] **Step 1: Write the sign-out button**

`src/components/auth/SignOutButton.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      Sair
    </Button>
  );
}
```

- [ ] **Step 2: Write the `/app` layout (nav + sign out)**

`src/app/app/layout.tsx`:

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
          <Link href="/account" className="text-sm text-muted-foreground hover:text-foreground">
            Minha conta
          </Link>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Write the `/app` placeholder page**

`src/app/app/page.tsx`:

```tsx
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function AppPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const name = session?.user.name ?? "";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Olá, {name}</h1>
      <p className="text-muted-foreground">
        Este é o painel do Sistema CRM. As funcionalidades de gestão de clientes e funil de vendas
        chegam aqui em breve — por enquanto, sua conta já está pronta: confira as opções em{" "}
        <span className="font-medium text-foreground">Minha conta</span>.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Manual verification**

Run `npm run dev`, log in with an existing account, land on `/app`. Expect the greeting with the
user's name and the placeholder message. Click "Minha conta" → navigates to `/account` (404 is
fine, built in Task 10). Click "Sair" → redirected to `/login` and the session cookie is cleared.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add placeholder dashboard with sign-out"
```

---

### Task 10: Account page (profile, change email, change password, avatar)

**Files:**
- Create: `src/components/account/ChangeEmailForm.tsx`
- Create: `src/components/account/ChangePasswordForm.tsx`
- Create: `src/components/account/AvatarUploader.tsx`
- Create: `src/app/api/account/avatar/route.ts`
- Create: `src/app/account/page.tsx`

- [ ] **Step 1: Install Vercel Blob**

```bash
npm install @vercel/blob
```

- [ ] **Step 2: Write the avatar upload API route**

`src/app/api/account/avatar/route.ts`:

```ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Envie uma imagem" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Imagem muito grande (máx. 5MB)" }, { status: 400 });
  }

  const blob = await put(`avatars/${session.user.id}-${Date.now()}`, file, {
    access: "public",
  });

  await db.update(user).set({ image: blob.url, updatedAt: new Date() }).where(eq(user.id, session.user.id));

  return NextResponse.json({ url: blob.url });
}
```

- [ ] **Step 3: Write the avatar uploader component**

`src/components/account/AvatarUploader.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AvatarUploader({ currentImage, name }: { currentImage?: string | null; name: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImage ?? null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/account/avatar", { method: "POST", body: formData });
    const data = await res.json();

    setUploading(false);
    if (!res.ok) {
      setError(data.error ?? "Falha ao enviar imagem");
      return;
    }
    setPreview(data.url);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16">
        <AvatarImage src={preview ?? undefined} alt={name} />
        <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div>
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? "Enviando..." : "Trocar foto"}
        </Button>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write the change-email form**

`src/components/account/ChangeEmailForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState(currentEmail);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error } = await authClient.changeEmail({ newEmail: email });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Não foi possível trocar o email.");
      return;
    }
    setMessage("Enviamos um link de confirmação para o novo email.");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Label htmlFor="new-email">Email</Label>
      <Input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading || email === currentEmail}>
        {loading ? "Enviando..." : "Trocar email"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 5: Write the change-password form**

`src/components/account/ChangePasswordForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Não foi possível trocar a senha.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setMessage("Senha alterada com sucesso.");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Label htmlFor="current-password">Senha atual</Label>
      <Input
        id="current-password"
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
      />
      <Label htmlFor="new-password">Nova senha</Label>
      <Input
        id="new-password"
        type="password"
        minLength={8}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Trocar senha"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 6: Write the account page (server component fetching the session)**

`src/app/account/page.tsx`:

```tsx
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AvatarUploader } from "@/components/account/AvatarUploader";
import { ChangeEmailForm } from "@/components/account/ChangeEmailForm";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session!.user;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-8">
      <div>
        <Link href="/app" className="text-sm text-muted-foreground hover:text-foreground">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Minha conta</h1>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-medium">Foto de perfil</h2>
        <AvatarUploader currentImage={user.image} name={user.name} />
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-medium">Email</h2>
        <ChangeEmailForm currentEmail={user.email} />
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-medium">Senha</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
```

- [ ] **Step 7: Manual verification**

Run `npm run dev`, log in, visit `/account`. Upload an image (any small PNG/JPG) → avatar preview
updates, reload the page → avatar persists (confirms Blob upload + DB update worked). Change the
password with the correct current password → success message; log out and log back in with the
new password → succeeds. Request an email change → check the dev server terminal for the
`[email:dev]` confirmation link.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add account page with avatar upload, change email, change password"
```

---

### Task 11: Landing page

**Files:**
- Create: `src/components/landing/Nav.tsx`
- Create: `src/components/landing/Hero.tsx`
- Create: `src/components/landing/Features.tsx`
- Create: `src/components/landing/Footer.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write the nav**

`src/components/landing/Nav.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Nav() {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
      <span className="text-lg font-semibold">Sistema CRM</span>
      <nav className="flex items-center gap-3">
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
          Entrar
        </Link>
        <Button asChild size="sm">
          <Link href="/signup">Criar conta grátis</Link>
        </Button>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Write the hero**

`src/components/landing/Hero.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24 text-center">
      <h1 className="bg-gradient-to-br from-foreground to-primary bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
        Seus clientes, organizados em um só lugar.
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
        A base do seu CRM: conta segura, acesso de qualquer dispositivo e pronta para crescer com
        o seu negócio.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/signup">Começar agora</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">Já tenho conta</Link>
        </Button>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Write the features section**

`src/components/landing/Features.tsx`:

```tsx
const FEATURES = [
  { title: "Seguro por padrão", description: "Autenticação, recuperação de senha e troca de email já prontas e protegidas." },
  { title: "Feito para qualquer tela", description: "Funciona igualmente bem no celular, tablet ou desktop." },
  { title: "Sua conta, seu controle", description: "Troque email, senha e foto de perfil quando quiser." },
];

export function Features() {
  return (
    <section className="mx-auto grid max-w-5xl gap-6 px-6 py-16 sm:grid-cols-3">
      {FEATURES.map((feature) => (
        <div key={feature.title} className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold">{feature.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 4: Write the footer**

`src/components/landing/Footer.tsx`:

```tsx
export function Footer() {
  return (
    <footer className="mx-auto max-w-5xl px-6 py-10 text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} Sistema CRM.
    </footer>
  );
}
```

- [ ] **Step 5: Replace the root page**

`src/app/page.tsx`:

```tsx
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div>
      <Nav />
      <Hero />
      <Features />
      <Footer />
    </div>
  );
}
```

- [ ] **Step 6: Manual verification**

Run `npm run dev`, visit `/`. Confirm the landing page renders with the dark palette and teal
gradient heading, "Criar conta grátis" and "Entrar" both navigate correctly, no console errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add landing page"
```

---

### Task 12: Responsive verification pass

**Files:** none (verification only)

- [ ] **Step 1: Check every page at mobile width (375px)**

Run `npm run dev`. Using browser dev tools' device toolbar (or the `resize_window` tool if
driving a browser programmatically), set the viewport to 375×812 and visit `/`, `/login`,
`/signup`, `/forgot-password`, `/app`, `/account`.
Expected: no horizontal scroll on any page, all text legible, buttons/inputs full-width and
tappable, nav doesn't overlap content.

- [ ] **Step 2: Check every page at tablet width (768px)**

Repeat at 768×1024.
Expected: layouts use the extra width sensibly (e.g. features grid may still stack or go
2-column), nothing looks stretched or cramped.

- [ ] **Step 3: Check every page at desktop width (1280px)**

Repeat at 1280×800.
Expected: content is centered with `max-w-*` containers (not stretched edge-to-edge), matches the
intended design.

- [ ] **Step 4: Fix any issues found**

If any page breaks at a given width, fix the specific Tailwind classes causing it (e.g. add
`flex-col sm:flex-row`, adjust `max-w-*`, add `overflow-x-hidden` only as a last resort — prefer
fixing the actual overflowing element). Re-check the fixed page at all three widths.

- [ ] **Step 5: Commit (only if fixes were made)**

```bash
git add -A
git commit -m "fix: responsive layout issues across breakpoints"
```

---

### Task 13: Deployment prep

**Files:**
- Create: `README.md`

- [ ] **Step 1: Verify the production build**

```bash
npm run build
```

Expected: build succeeds with no type errors. Fix any that appear before continuing.

- [ ] **Step 2: Write `README.md`**

```markdown
# Sistema CRM

Harness de uma aplicação CRM: autenticação completa, conta de usuário e landing page. Nenhuma
funcionalidade de CRM (contatos, funil, etc.) foi implementada ainda — este é o alicerce para
construir essas features em seguida.

## Stack
- Next.js 16 (App Router, TypeScript)
- Neon (Postgres) + Drizzle ORM
- Better Auth (email/senha, recuperação de senha, troca de email)
- Vercel Blob (upload de foto de perfil)
- Tailwind CSS + shadcn/ui, Framer Motion

## Setup local
1. `npm install`
2. Copie `.env.local.example` para `.env.local` e preencha `DATABASE_URL` (connection string do
   Neon). Gere `BETTER_AUTH_SECRET` com:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. `npx drizzle-kit generate && npx drizzle-kit migrate`
4. `npm run dev`

Sem `RESEND_API_KEY` configurado, os links de recuperação de senha e troca de email são logados
no console do servidor em vez de enviados por email — copie a URL do terminal para testar esses
fluxos localmente.

Sem `BLOB_READ_WRITE_TOKEN` configurado, o upload de foto de perfil falha com um erro tratado em
vez de quebrar — configure um Blob store na Vercel para habilitar o upload real.

## Deploy (Vercel)
1. Suba este repositório no GitHub e importe na Vercel.
2. Configure as variáveis de ambiente no projeto da Vercel: `DATABASE_URL`, `BETTER_AUTH_SECRET`,
   `BETTER_AUTH_URL` (sua URL de produção), `BLOB_READ_WRITE_TOKEN` (criado em Storage > Blob no
   dashboard da Vercel), `RESEND_API_KEY`, `EMAIL_FROM`.
3. Rode as migrações contra o banco de produção: `npx drizzle-kit migrate` com `DATABASE_URL`
   apontando para a branch de produção do Neon.
4. Deploy.

## Testes
```bash
npm test
```
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: add README with setup and deployment instructions"
```

- [ ] **Step 4: (User action, not automated) Create the Vercel project and Blob store**

This step requires the user's Vercel account — push the repo to GitHub, import it into Vercel,
create a Blob store under Storage in the Vercel dashboard, and set the environment variables
listed in the README. Confirm with the user before pushing to a remote or connecting Vercel, per
the standing rule on actions with external, shared-system effects.

---

## Self-Review Notes

- **Spec coverage:** login (Task 7), responsive (Task 12), distinctive design (Task 6 + landing
  in Task 11), landing page (Task 11), full account system — password recovery (Task 8), change
  password (Task 10), change email (Task 10), upload photo (Task 10) — all covered. Vercel/Neon/
  Better Auth stack wired in Tasks 3-4, deploy prep in Task 13.
- **Type consistency:** `AppPage` (Task 9) and `AccountPage` (Task 10) both call
  `auth.api.getSession({ headers: await headers() })`, matching the shape established in Task 4's
  `auth.ts`. No CRM domain types exist yet, so there's nothing to drift.
- **No placeholders:** all steps contain complete, runnable code or exact commands.

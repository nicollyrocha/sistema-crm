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

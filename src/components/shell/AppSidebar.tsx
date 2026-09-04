"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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

function NavLinks({
  pathname,
  onNavigate,
  large,
}: {
  pathname: string;
  onNavigate?: () => void;
  large?: boolean;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 font-medium transition-colors",
              large ? "py-3 text-base" : "gap-2.5 py-2 text-sm",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            )}
          >
            <Icon className={large ? "size-5" : "size-4"} />
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

  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 md:hidden">
        <Link href="/app" className="text-base font-semibold text-sidebar-foreground">
          Sistema CRM
        </Link>
        <button
          type="button"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex flex-col bg-sidebar md:hidden"
          >
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
              <Link
                href="/app"
                className="text-base font-semibold text-sidebar-foreground"
                onClick={() => setMobileOpen(false)}
              >
                Sistema CRM
              </Link>
              <button
                type="button"
                aria-label="Fechar menu"
                className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4">
              <NavLinks large pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              <div className="flex items-center justify-between border-t border-sidebar-border pt-4">
                <ThemeToggle />
                <SignOutButton />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

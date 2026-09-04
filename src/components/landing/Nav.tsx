import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

export function Nav() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-12">
      <span className="text-lg font-semibold">Sistema CRM</span>
      <nav className="flex items-center gap-3">
        <ThemeToggle />
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
          Entrar
        </Link>
        <Link href="/signup" className={cn(buttonVariants({ size: "sm" }))}>
          Criar conta grátis
        </Link>
      </nav>
    </header>
  );
}

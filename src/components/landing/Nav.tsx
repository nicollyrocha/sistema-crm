import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function Nav() {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
      <span className="text-lg font-semibold">Sistema CRM</span>
      <nav className="flex items-center gap-3">
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

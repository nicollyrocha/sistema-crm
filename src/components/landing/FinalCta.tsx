import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
      <div className="surface-card flex flex-col items-center gap-5 bg-primary/5 px-6 py-14 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Pronto para organizar suas vendas?
        </h2>
        <p className="max-w-md text-muted-foreground">
          Crie sua conta grátis e comece a organizar seus contatos e negociações hoje mesmo.
        </p>
        <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
          Criar conta grátis
        </Link>
      </div>
    </section>
  );
}

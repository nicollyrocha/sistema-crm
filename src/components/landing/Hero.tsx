import Link from "next/link";
import { Handshake, LayoutDashboard, Lock, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-12">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Lock className="size-3.5 text-primary" />
            Seguro por padrão
          </div>
          <h1 className="mt-5 bg-gradient-to-br from-foreground to-primary bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
            Seus clientes, organizados em um só lugar.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground lg:mx-0">
            A base do seu CRM: conta segura, acesso de qualquer dispositivo e pronta para crescer
            com o seu negócio.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
              Começar agora
            </Link>
            <Link href="/login" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              Já tenho conta
            </Link>
          </div>
        </div>

        <div className="surface-card mx-auto flex w-full max-w-md gap-3 p-3 lg:max-w-none">
          <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/50 p-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayoutDashboard className="size-4" />
            </div>
            <div className="flex size-8 items-center justify-center rounded-lg text-muted-foreground">
              <Users className="size-4" />
            </div>
            <div className="flex size-8 items-center justify-center rounded-lg text-muted-foreground">
              <Handshake className="size-4" />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Contatos</p>
                <p className="mt-1 text-lg font-bold text-foreground">128</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Em aberto</p>
                <p className="mt-1 text-lg font-bold text-primary">24</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Ganhas</p>
                <p className="mt-1 text-lg font-bold text-secondary-accent">9</p>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-center gap-1.5 rounded-xl border border-border bg-background/60 p-3">
              <div className="h-2 w-full rounded-full bg-primary/70" />
              <div className="h-2 w-4/5 rounded-full bg-primary/50" />
              <div className="h-2 w-3/5 rounded-full bg-secondary-accent/50" />
              <div className="h-2 w-2/5 rounded-full bg-secondary-accent/30" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

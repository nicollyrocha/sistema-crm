import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-12">
      <h1 className="bg-gradient-to-br from-foreground to-primary bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
        Seus clientes, organizados em um só lugar.
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
        A base do seu CRM: conta segura, acesso de qualquer dispositivo e pronta para crescer com
        o seu negócio.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/signup" className={buttonVariants({ size: "lg" })}>
          Começar agora
        </Link>
        <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
          Já tenho conta
        </Link>
      </div>
    </section>
  );
}

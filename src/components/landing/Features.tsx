import { Handshake, LayoutDashboard, ShieldCheck, Smartphone, SunMoon, Users } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

const FEATURES: {
  icon: ComponentType<{ className?: string }>;
  accent: "primary" | "secondary-accent";
  title: string;
  description: string;
}[] = [
  {
    icon: Users,
    accent: "primary",
    title: "Contatos",
    description: "Organize contatos com status de lead, ativo ou inativo.",
  },
  {
    icon: Handshake,
    accent: "secondary-accent",
    title: "Funil de vendas",
    description: "Acompanhe negociações em um kanban organizado por estágio.",
  },
  {
    icon: LayoutDashboard,
    accent: "primary",
    title: "Dashboard",
    description: "Veja métricas de contatos e negociações em aberto num só lugar.",
  },
  {
    icon: ShieldCheck,
    accent: "secondary-accent",
    title: "Seguro por padrão",
    description: "Autenticação, recuperação de senha e troca de email já protegidas.",
  },
  {
    icon: Smartphone,
    accent: "primary",
    title: "Feito para qualquer tela",
    description: "Funciona igualmente bem no celular, tablet ou desktop.",
  },
  {
    icon: SunMoon,
    accent: "secondary-accent",
    title: "Claro ou escuro",
    description: "Tema que segue sua preferência, com opção de trocar manualmente.",
  },
];

export function Features() {
  return (
    <section id="recursos" className="mx-auto max-w-7xl scroll-mt-16 px-6 py-16 lg:px-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tudo o que você precisa</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Um CRM simples, com o essencial para organizar seus contatos e fechar mais negócios.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="surface-card p-6">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-lg",
                feature.accent === "primary"
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary-accent/10 text-secondary-accent"
              )}
            >
              <feature.icon className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

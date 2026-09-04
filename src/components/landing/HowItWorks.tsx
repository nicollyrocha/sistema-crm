const STEPS = [
  {
    number: "1",
    title: "Crie sua conta",
    description: "Cadastro rápido com email e senha.",
  },
  {
    number: "2",
    title: "Adicione seus contatos",
    description: "Organize leads e clientes com status.",
  },
  {
    number: "3",
    title: "Acompanhe o funil",
    description: "Mova negociações entre os estágios até o fechamento.",
  },
  {
    number: "4",
    title: "Acompanhe pelo dashboard",
    description: "Veja métricas do seu negócio em um só lugar.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-7xl scroll-mt-16 px-6 py-16 lg:px-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Como funciona</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Do cadastro ao fechamento, em quatro passos simples.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <div key={step.number} className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {step.number}
            </div>
            <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

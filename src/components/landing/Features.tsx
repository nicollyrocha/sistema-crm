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

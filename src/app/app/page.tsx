import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function AppPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const name = session?.user.name ?? "";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Olá, {name}</h1>
      <p className="text-muted-foreground">
        Este é o painel do Sistema CRM. As funcionalidades de gestão de clientes e funil de vendas
        chegam aqui em breve — por enquanto, sua conta já está pronta: confira as opções em{" "}
        <span className="font-medium text-foreground">Minha conta</span>.
      </p>
    </div>
  );
}

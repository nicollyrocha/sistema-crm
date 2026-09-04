import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AvatarUploader } from "@/components/account/AvatarUploader";
import { ChangeEmailForm } from "@/components/account/ChangeEmailForm";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  const user = session.user;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Minha conta</h1>

      <div className="flex flex-col">
        <section className="grid gap-4 border-b border-border py-6 first:pt-0 lg:grid-cols-[240px_1fr] lg:gap-12">
          <div>
            <h2 className="text-base font-medium">Foto de perfil</h2>
            <p className="mt-1 text-sm text-muted-foreground">Uma imagem para identificar sua conta.</p>
          </div>
          <div className="max-w-md">
            <AvatarUploader currentImage={user.image} name={user.name} />
          </div>
        </section>

        <section className="grid gap-4 border-b border-border py-6 lg:grid-cols-[240px_1fr] lg:gap-12">
          <div>
            <h2 className="text-base font-medium">Email</h2>
            <p className="mt-1 text-sm text-muted-foreground">O email usado para entrar e receber notificações.</p>
          </div>
          <div className="max-w-md">
            <ChangeEmailForm currentEmail={user.email} />
          </div>
        </section>

        <section className="grid gap-4 py-6 lg:grid-cols-[240px_1fr] lg:gap-12">
          <div>
            <h2 className="text-base font-medium">Senha</h2>
            <p className="mt-1 text-sm text-muted-foreground">Recomendamos usar uma senha forte e exclusiva.</p>
          </div>
          <div className="max-w-md">
            <ChangePasswordForm />
          </div>
        </section>
      </div>
    </div>
  );
}

import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AvatarUploader } from "@/components/account/AvatarUploader";
import { ChangeEmailForm } from "@/components/account/ChangeEmailForm";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login?session_expired=1");
  }
  const user = session.user;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-8">
      <div>
        <Link href="/app" className="text-sm text-muted-foreground hover:text-foreground">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Minha conta</h1>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-medium">Foto de perfil</h2>
        <AvatarUploader currentImage={user.image} name={user.name} />
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-medium">Email</h2>
        <ChangeEmailForm currentEmail={user.email} />
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-medium">Senha</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}

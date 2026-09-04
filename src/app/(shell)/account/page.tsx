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

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Foto de perfil</h2>
          <AvatarUploader currentImage={user.image} name={user.name} />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Email</h2>
          <ChangeEmailForm currentEmail={user.email} />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Senha</h2>
          <ChangePasswordForm />
        </section>
      </div>
    </div>
  );
}

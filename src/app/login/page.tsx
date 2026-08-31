import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
        <h1 className="mb-6 text-2xl font-semibold">Entrar</h1>
        <LoginForm />
        <p className="mt-6 text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link href="/signup" className="text-primary underline">
            Criar conta
          </Link>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          <Link href="/forgot-password" className="text-primary underline">
            Esqueci minha senha
          </Link>
        </p>
      </div>
    </main>
  );
}

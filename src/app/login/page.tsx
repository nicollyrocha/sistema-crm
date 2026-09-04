import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { MotionCard } from "@/components/ui/motion-card";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between p-6">
        <Link href="/" className="text-sm font-semibold">
          Sistema CRM
        </Link>
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <MotionCard className="surface-card w-full max-w-sm p-8">
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
        </MotionCard>
      </div>
    </main>
  );
}

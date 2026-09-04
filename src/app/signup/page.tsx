import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";
import { MotionCard } from "@/components/ui/motion-card";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function SignupPage() {
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
          <h1 className="mb-6 text-2xl font-semibold">Criar conta</h1>
          <SignupForm />
          <p className="mt-6 text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/login" className="text-primary underline">
              Entrar
            </Link>
          </p>
        </MotionCard>
      </div>
    </main>
  );
}

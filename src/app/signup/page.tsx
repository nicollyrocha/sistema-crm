import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";
import { MotionCard } from "@/components/ui/motion-card";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <MotionCard className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
        <h1 className="mb-6 text-2xl font-semibold">Criar conta</h1>
        <SignupForm />
        <p className="mt-6 text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="text-primary underline">
            Entrar
          </Link>
        </p>
      </MotionCard>
    </main>
  );
}

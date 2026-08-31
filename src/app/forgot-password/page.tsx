import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { MotionCard } from "@/components/ui/motion-card";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <MotionCard className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
        <h1 className="mb-6 text-2xl font-semibold">Esqueci minha senha</h1>
        <ForgotPasswordForm />
      </MotionCard>
    </main>
  );
}

import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leadFormToken } from "@/db/schema";
import { LeadForm } from "@/components/leadform/LeadForm";

export default async function LeadFormPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [row] = await db.select().from(leadFormToken).where(eq(leadFormToken.token, token));
  if (!row) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="surface-card w-full max-w-sm p-8">
        <h1 className="mb-1 text-lg font-semibold">Sistema CRM</h1>
        <p className="mb-6 text-sm text-muted-foreground">Preencha seus dados e entraremos em contato.</p>
        <LeadForm token={token} />
      </div>
    </main>
  );
}

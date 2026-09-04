import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { StatCard } from "@/components/dashboard/StatCard";
import { DEAL_STAGES } from "@/lib/deal-stages";
import { formatCentsToBRL } from "@/lib/currency";
import { getContactStats, getDealStats } from "./dashboard-data";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const [contactStats, dealStats] = await Promise.all([getContactStats(), getDealStats()]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Contatos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total" value={String(contactStats.total)} />
          <StatCard label="Lead" value={String(contactStats.lead)} />
          <StatCard label="Ativo" value={String(contactStats.active)} />
          <StatCard label="Inativo" value={String(contactStats.inactive)} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Negociações em aberto</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard label="Negociações abertas" value={String(dealStats.openCount)} />
          <StatCard label="Valor em aberto" value={formatCentsToBRL(dealStats.openValue)} />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Funil por estágio</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {dealStats.byStage.map((stat) => {
            const stageLabel = DEAL_STAGES.find((s) => s.value === stat.stage)?.label ?? stat.stage;
            return (
              <StatCard
                key={stat.stage}
                label={stageLabel}
                value={formatCentsToBRL(stat.value)}
                sublabel={`${stat.count} ${stat.count === 1 ? "negociação" : "negociações"}`}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

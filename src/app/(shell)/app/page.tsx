import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { StatCard } from "@/components/dashboard/StatCard";
import { BarList } from "@/components/dashboard/BarList";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { DEAL_STAGES } from "@/lib/deal-stages";
import { formatCentsToBRL } from "@/lib/currency";
import { getContactStats, getDealStats } from "./dashboard-data";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const [contactStats, dealStats] = await Promise.all([getContactStats(), getDealStats()]);

  const forwardStages = DEAL_STAGES.filter((s) => s.value !== "lost");
  const lostStage = dealStats.byStage.find((s) => s.stage === "lost");
  const lostCount = lostStage?.count ?? 0;

  const winRateLabel = dealStats.winRate === null ? "—" : `${dealStats.winRate}%`;
  const closedTotal = dealStats.wonCount + dealStats.lostCount;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total de contatos" value={String(contactStats.total)} />
        <StatCard label="Negociações abertas" value={String(dealStats.openCount)} accent="secondary" />
        <StatCard label="Valor em aberto" value={formatCentsToBRL(dealStats.openValue)} />
        <StatCard label="Taxa de conversão" value={winRateLabel} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card flex flex-col gap-4 p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Funil de vendas</h2>
          <BarList
            items={forwardStages.map((s) => {
              const stat = dealStats.byStage.find((b) => b.stage === s.value);
              const count = stat?.count ?? 0;
              return {
                label: s.label,
                value: count,
                displayValue: `${count} ${count === 1 ? "negociação" : "negociações"}`,
                colorClassName: s.value === "won" ? "bg-secondary-accent" : "bg-primary",
              };
            })}
          />
          <p className="text-xs text-muted-foreground">
            {lostCount === 0 ? "Nenhuma negociação perdida" : `${lostCount} ${lostCount === 1 ? "negociação perdida" : "negociações perdidas"}`}
          </p>
        </div>

        <div className="surface-card flex flex-col items-center justify-center gap-4 p-6 lg:col-span-1">
          <h2 className="self-start text-sm font-semibold text-muted-foreground">Taxa de conversão</h2>
          <DonutChart
            segments={[
              { label: "Ganhas", value: dealStats.wonCount, colorClassName: "stroke-secondary-accent" },
              { label: "Perdidas", value: dealStats.lostCount, colorClassName: "stroke-muted-foreground" },
            ]}
            centerLabel={winRateLabel}
            centerSublabel={closedTotal === 0 ? undefined : `${dealStats.wonCount} de ${closedTotal} fechadas`}
          />
          {closedTotal === 0 && (
            <p className="text-center text-xs text-muted-foreground">Nenhuma negociação fechada ainda</p>
          )}
        </div>

        <div className="surface-card flex flex-col gap-4 p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Valor por estágio</h2>
          <BarList
            items={forwardStages.map((s) => {
              const stat = dealStats.byStage.find((b) => b.stage === s.value);
              const value = stat?.value ?? 0;
              return {
                label: s.label,
                value,
                displayValue: formatCentsToBRL(value),
                colorClassName: s.value === "won" ? "bg-secondary-accent" : "bg-primary",
              };
            })}
          />
        </div>

        <div className="surface-card flex flex-col items-center gap-4 p-6 lg:col-span-1">
          <h2 className="self-start text-sm font-semibold text-muted-foreground">Contatos por status</h2>
          <DonutChart
            segments={[
              { label: "Lead", value: contactStats.lead, colorClassName: "stroke-secondary-accent" },
              { label: "Ativo", value: contactStats.active, colorClassName: "stroke-primary" },
              { label: "Inativo", value: contactStats.inactive, colorClassName: "stroke-muted-foreground" },
            ]}
            centerLabel={String(contactStats.total)}
            centerSublabel="contatos"
          />
          <div className="flex w-full flex-col gap-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2 rounded-full bg-secondary-accent" />
                Lead
              </span>
              <span className="font-semibold text-foreground">{contactStats.lead}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2 rounded-full bg-primary" />
                Ativo
              </span>
              <span className="font-semibold text-foreground">{contactStats.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2 rounded-full bg-muted-foreground" />
                Inativo
              </span>
              <span className="font-semibold text-foreground">{contactStats.inactive}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

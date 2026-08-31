import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DealBoard } from "@/components/deals/DealBoard";
import { listDeals, listContactsForPicker, createDeal, updateDeal, updateDealStage, deleteDeal } from "./actions";

export default async function DealsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login?session_expired=1");
  }

  const [deals, contacts] = await Promise.all([listDeals(), listContactsForPicker()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Funil de vendas</h1>
      <DealBoard
        initialDeals={deals}
        contacts={contacts}
        onCreate={createDeal}
        onUpdate={updateDeal}
        onStageChange={updateDealStage}
        onDelete={deleteDeal}
      />
    </div>
  );
}

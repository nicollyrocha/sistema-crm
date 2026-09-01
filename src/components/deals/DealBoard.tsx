"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { DealCard, type Deal } from "./DealCard";
import { DealForm, type ContactOption } from "./DealForm";
import { DEAL_STAGES } from "@/lib/deal-stages";
import type { DealInput } from "@/lib/validation";

export function DealBoard({
  initialDeals,
  contacts,
  onCreate,
  onUpdate,
  onStageChange,
  onDelete,
}: {
  initialDeals: Deal[];
  contacts: ContactOption[];
  onCreate: (values: DealInput) => Promise<void>;
  onUpdate: (id: string, values: DealInput) => Promise<void>;
  onStageChange: (id: string, stage: DealInput["stage"]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [formResetKey, setFormResetKey] = useState(0);

  async function handleCreate(values: DealInput) {
    await onCreate(values);
    setFormResetKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      {contacts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Você precisa ter pelo menos um contato antes de criar uma negociação.{" "}
          <Link href="/app/contacts" className="text-primary underline">
            Adicionar contato
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4">
          <DealForm
            key={formResetKey}
            contacts={contacts}
            submitLabel="Adicionar negociação"
            onSubmit={handleCreate}
          />
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2">
        {DEAL_STAGES.map((stageDef) => {
          const dealsInStage = initialDeals.filter((d) => d.stage === stageDef.value);
          return (
            <div key={stageDef.value} className="flex w-72 shrink-0 flex-col gap-3">
              <h2 className="text-sm font-semibold text-muted-foreground">
                {stageDef.label} ({dealsInStage.length})
              </h2>
              {dealsInStage.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma negociação</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {dealsInStage.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        contacts={contacts}
                        onUpdate={onUpdate}
                        onStageChange={onStageChange}
                        onDelete={onDelete}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

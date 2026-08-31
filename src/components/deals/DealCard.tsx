"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { DealForm, type ContactOption } from "./DealForm";
import { DEAL_STAGES } from "@/lib/deal-stages";
import { formatCentsToBRL } from "@/lib/currency";
import type { DealInput } from "@/lib/validation";

export type Deal = {
  id: string;
  title: string;
  value: number | null;
  expectedCloseDate: string | null;
  notes: string | null;
  stage: string;
  contactId: string;
  contactName: string;
};

export function DealCard({
  deal,
  contacts,
  onUpdate,
  onStageChange,
  onDelete,
}: {
  deal: Deal;
  contacts: ContactOption[];
  onUpdate: (id: string, values: DealInput) => Promise<void>;
  onStageChange: (id: string, stage: DealInput["stage"]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);

  if (editing) {
    return (
      <li className="rounded-xl border border-border bg-card p-4">
        <DealForm
          contacts={contacts}
          initialValues={{
            title: deal.title,
            contactId: deal.contactId,
            value: deal.value,
            expectedCloseDate: deal.expectedCloseDate,
            notes: deal.notes,
            stage: deal.stage as DealInput["stage"],
          }}
          submitLabel="Salvar"
          onCancel={() => setEditing(false)}
          onSubmit={async (values) => {
            await onUpdate(deal.id, values);
            setEditing(false);
          }}
        />
      </li>
    );
  }

  async function handleDelete() {
    setDeleteError(null);
    setDeleting(true);
    try {
      await onDelete(deal.id);
    } catch {
      setDeleteError("Não foi possível excluir a negociação.");
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  async function handleStageChange(newStage: string) {
    setStageError(null);
    try {
      await onStageChange(deal.id, newStage as DealInput["stage"]);
    } catch {
      setStageError("Não foi possível mover a negociação.");
    }
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
    >
      <p className="min-w-0 break-words font-medium">{deal.title}</p>
      <p className="min-w-0 break-words text-sm text-muted-foreground">{deal.contactName}</p>
      {deal.value != null && <p className="text-sm text-foreground">{formatCentsToBRL(deal.value)}</p>}
      {deal.expectedCloseDate && (
        <p className="text-xs text-muted-foreground">
          Previsão: {new Date(`${deal.expectedCloseDate}T00:00:00`).toLocaleDateString("pt-BR")}
        </p>
      )}
      {deal.notes && <p className="min-w-0 break-words text-sm text-muted-foreground">{deal.notes}</p>}

      <Select aria-label="Estágio" value={deal.stage} onChange={(e) => handleStageChange(e.target.value)}>
        {DEAL_STAGES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
      {stageError && <p className="text-sm text-destructive">{stageError}</p>}
      {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}

      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          Editar
        </Button>
        {confirmingDelete ? (
          <>
            <Button size="sm" variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? "Excluindo..." : "Confirmar"}
            </Button>
            <Button size="sm" variant="ghost" disabled={deleting} onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(true)}>
            Excluir
          </Button>
        )}
      </div>
    </motion.li>
  );
}

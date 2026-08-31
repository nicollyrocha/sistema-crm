"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ContactForm } from "./ContactForm";
import type { ContactInput } from "@/lib/validation";

export type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  status: string;
};

const STATUS_LABELS: Record<string, string> = {
  lead: "Lead",
  active: "Ativo",
  inactive: "Inativo",
};

export function ContactItem({
  contact,
  onUpdate,
  onDelete,
}: {
  contact: Contact;
  onUpdate: (id: string, values: ContactInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (editing) {
    return (
      <li className="rounded-xl border border-border bg-card p-4">
        <ContactForm
          initialValues={{
            name: contact.name,
            email: contact.email ?? "",
            phone: contact.phone ?? "",
            company: contact.company ?? "",
            notes: contact.notes ?? "",
            status: (contact.status as ContactInput["status"]) ?? "lead",
          }}
          submitLabel="Salvar"
          onCancel={() => setEditing(false)}
          onSubmit={async (values) => {
            await onUpdate(contact.id, values);
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
      await onDelete(contact.id);
    } catch {
      setDeleteError("Não foi possível excluir o contato.");
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{contact.name}</p>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
            {STATUS_LABELS[contact.status] ?? contact.status}
          </span>
        </div>
        <div className="mt-1 flex flex-col gap-0.5 text-sm text-muted-foreground">
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <span>{contact.phone}</span>}
          {contact.company && <span>{contact.company}</span>}
        </div>
        {contact.notes && <p className="mt-2 text-sm text-muted-foreground">{contact.notes}</p>}
        {deleteError && <p className="mt-2 text-sm text-destructive">{deleteError}</p>}
      </div>
      <div className="flex shrink-0 gap-1">
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

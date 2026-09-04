"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useDeleteConfirm, DeleteConfirmButtons } from "@/components/ui/delete-confirm";
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
  const {
    confirming: confirmingDelete,
    deleting,
    error: deleteError,
    requestDelete,
    cancelDelete,
    handleDelete,
  } = useDeleteConfirm(() => onDelete(contact.id), "Não foi possível excluir o contato.");

  if (editing) {
    return (
      <li className="surface-card p-4">
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

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="surface-card flex flex-col gap-3 p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 break-words font-medium">{contact.name}</p>
        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
          {STATUS_LABELS[contact.status] ?? contact.status}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 break-words text-sm text-muted-foreground">
        {contact.email && <span>{contact.email}</span>}
        {contact.phone && <span>{contact.phone}</span>}
        {contact.company && <span>{contact.company}</span>}
      </div>
      {contact.notes && <p className="break-words text-sm text-muted-foreground">{contact.notes}</p>}
      {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
      <div className="mt-auto flex gap-1 pt-1">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          Editar
        </Button>
        <DeleteConfirmButtons
          confirming={confirmingDelete}
          deleting={deleting}
          onRequest={requestDelete}
          onConfirm={handleDelete}
          onCancel={cancelDelete}
        />
      </div>
    </motion.li>
  );
}

"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContactItem, type Contact } from "./ContactItem";
import { ContactForm } from "./ContactForm";
import type { ContactInput } from "@/lib/validation";

const STATUS_FILTERS: { value: "all" | ContactInput["status"]; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "lead", label: "Lead" },
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
];

export function ContactList({
  initialContacts,
  onCreate,
  onUpdate,
  onDelete,
}: {
  initialContacts: Contact[];
  onCreate: (values: ContactInput) => Promise<void>;
  onUpdate: (id: string, values: ContactInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ContactInput["status"]>("all");
  const [formResetKey, setFormResetKey] = useState(0);

  async function handleCreate(values: ContactInput) {
    await onCreate(values);
    setFormResetKey((k) => k + 1);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialContacts.filter((c) => {
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.company ?? "").toLowerCase().includes(q)
      );
    });
  }, [initialContacts, query, statusFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="surface-card p-4">
        <ContactForm key={formResetKey} submitLabel="Adicionar contato" onSubmit={handleCreate} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          placeholder="Buscar por nome, email ou empresa..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar contatos"
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar por status">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={statusFilter === filter.value ? "default" : "outline"}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground">
          {initialContacts.length === 0
            ? "Nenhum contato ainda. Adicione o primeiro acima."
            : "Nenhum contato encontrado."}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {filtered.map((contact) => (
              <ContactItem key={contact.id} contact={contact} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

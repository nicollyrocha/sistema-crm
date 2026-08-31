"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ContactInput } from "@/lib/validation";

const STATUS_OPTIONS: { value: ContactInput["status"]; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
];

export function ContactForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValues?: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    notes?: string;
    status?: ContactInput["status"];
  };
  submitLabel: string;
  onSubmit: (values: ContactInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [company, setCompany] = useState(initialValues?.company ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [status, setStatus] = useState<ContactInput["status"]>(initialValues?.status ?? "lead");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const formId = useId();
  const nameId = `${formId}-name`;
  const emailId = `${formId}-email`;
  const phoneId = `${formId}-phone`;
  const companyId = `${formId}-company`;
  const notesId = `${formId}-notes`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({ name, email, phone, company, notes, status });
    } catch {
      setError("Não foi possível salvar o contato.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={nameId}>Nome</Label>
          <Input
            id={nameId}
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={200}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={emailId}>Email</Label>
          <Input
            id={emailId}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={phoneId}>Telefone</Label>
          <Input
            id={phoneId}
            placeholder="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={companyId}>Empresa</Label>
          <Input
            id={companyId}
            placeholder="Empresa"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={notesId}>Notas</Label>
        <Textarea
          id={notesId}
          placeholder="Notas (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
        />
      </div>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Status do contato">
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={status === option.value ? "default" : "outline"}
            onClick={() => setStatus(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !name.trim()}>
          {loading ? "Salvando..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}

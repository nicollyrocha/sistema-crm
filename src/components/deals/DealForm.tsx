"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { formatCentsToBRL, parseCurrencyToCents } from "@/lib/currency";
import type { DealInput } from "@/lib/validation";

export type ContactOption = { id: string; name: string };

export function DealForm({
  contacts,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  contacts: ContactOption[];
  initialValues?: {
    title?: string;
    contactId?: string;
    value?: number | null;
    expectedCloseDate?: string | null;
    notes?: string | null;
    stage?: DealInput["stage"];
  };
  submitLabel: string;
  onSubmit: (values: DealInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [contactId, setContactId] = useState(initialValues?.contactId ?? contacts[0]?.id ?? "");
  const [value, setValue] = useState(
    initialValues?.value != null ? formatCentsToBRL(initialValues.value).replace("R$", "").trim() : ""
  );
  const [expectedCloseDate, setExpectedCloseDate] = useState(initialValues?.expectedCloseDate ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [stage] = useState<DealInput["stage"]>(initialValues?.stage ?? "prospecting");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formId = useId();
  const titleId = `${formId}-title`;
  const contactSelectId = `${formId}-contact`;
  const valueId = `${formId}-value`;
  const dateId = `${formId}-date`;
  const notesId = `${formId}-notes`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        title,
        contactId,
        value: parseCurrencyToCents(value),
        expectedCloseDate,
        notes,
        stage,
      });
    } catch {
      setError("Não foi possível salvar a negociação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor={titleId}>Título</Label>
          <Input id={titleId} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={contactSelectId}>Contato</Label>
          <Select
            id={contactSelectId}
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            required
          >
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={valueId}>Valor (R$)</Label>
          <Input id={valueId} placeholder="0,00" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={dateId}>Previsão de fechamento</Label>
          <Input
            id={dateId}
            type="date"
            value={expectedCloseDate ?? ""}
            onChange={(e) => setExpectedCloseDate(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={notesId}>Notas</Label>
        <Textarea
          id={notesId}
          placeholder="Notas (opcional)"
          value={notes ?? ""}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !title.trim() || !contactId}>
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

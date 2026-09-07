"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitLeadForm } from "@/app/f/[token]/actions";

export function LeadForm({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const formId = useId();
  const nameId = `${formId}-name`;
  const emailId = `${formId}-email`;
  const phoneId = `${formId}-phone`;
  const companyId = `${formId}-company`;
  const notesId = `${formId}-notes`;
  const websiteId = `${formId}-website`;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await submitLeadForm(token, { name, email, phone, company, notes, website });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Não foi possível enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return <p className="text-sm text-muted-foreground">Obrigado! Entraremos em contato em breve.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5">
        <Label htmlFor={nameId}>Nome</Label>
        <Input id={nameId} value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} />
      </div>
      <div className="flex flex-col gap-2.5">
        <Label htmlFor={emailId}>Email</Label>
        <Input id={emailId} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2.5">
        <Label htmlFor={phoneId}>Telefone</Label>
        <Input id={phoneId} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2.5">
        <Label htmlFor={companyId}>Empresa</Label>
        <Input id={companyId} value={company} onChange={(e) => setCompany(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2.5">
        <Label htmlFor={notesId}>Mensagem</Label>
        <Textarea id={notesId} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
      </div>
      <div className="sr-only">
        <Label htmlFor={websiteId}>Não preencha este campo</Label>
        <input
          id={websiteId}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading || !name.trim()}>
        {loading ? "Enviando..." : "Enviar"}
      </Button>
    </form>
  );
}

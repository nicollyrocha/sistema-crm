"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState(currentEmail);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error } = await authClient.changeEmail({ newEmail: email });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Não foi possível trocar o email.");
      return;
    }
    setMessage("Enviamos um link de confirmação para o novo email.");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5">
        <Label htmlFor="new-email">Email</Label>
        <Input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading || email === currentEmail}>
        {loading ? "Enviando..." : "Trocar email"}
      </Button>
    </form>
  );
}

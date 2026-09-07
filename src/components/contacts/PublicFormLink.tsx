"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeleteConfirm } from "@/components/ui/delete-confirm";

export function PublicFormLink({
  baseUrl,
  token,
  onRegenerate,
}: {
  baseUrl: string;
  token: string;
  onRegenerate: () => Promise<string>;
}) {
  const [currentToken, setCurrentToken] = useState(token);
  const [copied, setCopied] = useState(false);
  const currentUrl = `${baseUrl}/f/${currentToken}`;

  const { confirming, deleting, error, requestDelete, cancelDelete, handleDelete } = useDeleteConfirm(async () => {
    const newToken = await onRegenerate();
    setCurrentToken(newToken);
  }, "Não foi possível gerar um novo link.");

  async function handleCopy() {
    await navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="surface-card flex flex-col gap-3 p-4">
      <div>
        <h2 className="text-sm font-semibold">Formulário de captação</h2>
        <p className="text-sm text-muted-foreground">
          Compartilhe esse link para receber novos contatos direto no seu CRM.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          readOnly
          value={currentUrl}
          onFocus={(e) => e.target.select()}
          aria-label="Link do formulário de captação"
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={handleCopy}>
          {copied ? "Copiado!" : "Copiar"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-1">
        {confirming ? (
          <>
            <Button type="button" size="sm" variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? "Gerando..." : "Confirmar"}
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={deleting} onClick={cancelDelete}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button type="button" size="sm" variant="ghost" onClick={requestDelete}>
            Gerar novo link
          </Button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeleteConfirm } from "@/components/ui/delete-confirm";

function RegenerateControl({ onRegenerate }: { onRegenerate: () => Promise<void> }) {
  const { confirming, deleting, error, requestDelete, cancelDelete, handleDelete } = useDeleteConfirm(
    onRegenerate,
    "Não foi possível gerar um novo link."
  );

  return (
    <>
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
    </>
  );
}

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
  const [prevToken, setPrevToken] = useState(token);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const currentUrl = `${baseUrl}/f/${currentToken}`;

  // Resync if the server-provided token ever changes for a reason other than
  // this component's own regenerate call (e.g. a future server-side path, or
  // a second tab regenerating the same user's token). Adjusting state during
  // render (React's documented pattern for this) avoids the extra render an
  // effect-based sync would cause.
  if (token !== prevToken) {
    setPrevToken(token);
    setCurrentToken(token);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopyError(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
      setCopied(false);
    }
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
      <p aria-live="polite" className="sr-only">
        {copied ? "Link copiado para a área de transferência." : ""}
      </p>
      {copyError && (
        <p className="text-sm text-destructive">
          Não foi possível copiar automaticamente. Selecione o texto do campo acima e copie manualmente.
        </p>
      )}
      <RegenerateControl
        key={currentToken}
        onRegenerate={async () => {
          const newToken = await onRegenerate();
          setCurrentToken(newToken);
        }}
      />
    </div>
  );
}

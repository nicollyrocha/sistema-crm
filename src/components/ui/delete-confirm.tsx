"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function useDeleteConfirm(onDelete: () => Promise<void>, errorMessage: string) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setDeleting(true);
    try {
      await onDelete();
    } catch {
      setError(errorMessage);
      setDeleting(false);
      setConfirming(false);
    }
  }

  return {
    confirming,
    deleting,
    error,
    requestDelete: () => setConfirming(true),
    cancelDelete: () => setConfirming(false),
    handleDelete,
  };
}

export function DeleteConfirmButtons({
  confirming,
  deleting,
  onRequest,
  onConfirm,
  onCancel,
}: {
  confirming: boolean;
  deleting: boolean;
  onRequest: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!confirming) {
    return (
      <Button size="sm" variant="ghost" onClick={onRequest}>
        Excluir
      </Button>
    );
  }

  return (
    <>
      <Button size="sm" variant="destructive" disabled={deleting} onClick={onConfirm}>
        {deleting ? "Excluindo..." : "Confirmar"}
      </Button>
      <Button size="sm" variant="ghost" disabled={deleting} onClick={onCancel}>
        Cancelar
      </Button>
    </>
  );
}

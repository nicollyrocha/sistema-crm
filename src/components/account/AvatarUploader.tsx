"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AvatarUploader({ currentImage, name }: { currentImage?: string | null; name: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImage ?? null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/account/avatar", { method: "POST", body: formData });
    const data = await res.json();

    setUploading(false);
    if (!res.ok) {
      setError(data.error ?? "Falha ao enviar imagem");
      return;
    }
    setPreview(data.url);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16">
        <AvatarImage src={preview ?? undefined} alt={name} />
        <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div>
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? "Enviando..." : "Trocar foto"}
        </Button>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}

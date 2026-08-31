import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
  }
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return NextResponse.json({ error: "Envie uma imagem (SVG não é permitido)" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Imagem muito grande (máx. 5MB)" }, { status: 400 });
  }

  try {
    const blob = await put(`avatars/${session.user.id}-${Date.now()}`, file, {
      access: "public",
    });

    await db.update(user).set({ image: blob.url, updatedAt: new Date() }).where(eq(user.id, session.user.id));

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Failed to upload avatar:", error);
    return NextResponse.json({ error: "Falha ao enviar imagem. Tente novamente mais tarde." }, { status: 500 });
  }
}

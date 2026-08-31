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
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Envie uma imagem" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Imagem muito grande (máx. 5MB)" }, { status: 400 });
  }

  const blob = await put(`avatars/${session.user.id}-${Date.now()}`, file, {
    access: "public",
  });

  await db.update(user).set({ image: blob.url, updatedAt: new Date() }).where(eq(user.id, session.user.id));

  return NextResponse.json({ url: blob.url });
}

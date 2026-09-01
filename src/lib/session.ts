import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Não autenticado");
  return session.user.id;
}

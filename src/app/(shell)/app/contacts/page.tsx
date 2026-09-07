import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ContactList } from "@/components/contacts/ContactList";
import { PublicFormLink } from "@/components/contacts/PublicFormLink";
import {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  getOrCreateFormToken,
  regenerateFormToken,
} from "./actions";

export default async function AppPage() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (!session) {
    redirect("/login");
  }

  const [contacts, token] = await Promise.all([listContacts(), getOrCreateFormToken()]);

  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Contatos</h1>
      <PublicFormLink baseUrl={baseUrl} token={token} onRegenerate={regenerateFormToken} />
      <ContactList
        initialContacts={contacts}
        onCreate={createContact}
        onUpdate={updateContact}
        onDelete={deleteContact}
      />
    </div>
  );
}

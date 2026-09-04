import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ContactList } from "@/components/contacts/ContactList";
import { listContacts, createContact, updateContact, deleteContact } from "./actions";

export default async function AppPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const contacts = await listContacts();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Contatos</h1>
      <ContactList
        initialContacts={contacts}
        onCreate={createContact}
        onUpdate={updateContact}
        onDelete={deleteContact}
      />
    </div>
  );
}

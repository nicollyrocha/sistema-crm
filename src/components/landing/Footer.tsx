import Link from "next/link";

const LINKS = [
  { href: "#recursos", label: "Recursos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "/login", label: "Entrar" },
  { href: "/signup", label: "Criar conta" },
];

export function Footer() {
  return (
    <footer className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
      <div className="flex flex-col gap-8 border-t border-border pt-10 sm:flex-row sm:justify-between">
        <div>
          <span className="text-lg font-semibold">Sistema CRM</span>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Seus clientes, organizados em um só lugar.
          </p>
        </div>

        <nav className="flex flex-col gap-2 sm:items-end">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground sm:text-left">
        © {new Date().getFullYear()} Sistema CRM.
      </p>
    </footer>
  );
}

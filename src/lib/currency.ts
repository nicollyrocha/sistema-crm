export function parseCurrencyToCents(input: string): number | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  const withoutStrayChars = trimmed.replace(/[^\d,.-]/g, "");
  // Treat a "." as a thousands separator only when followed by exactly three digits
  // and then a non-digit or end-of-string (e.g. "1.500,00" or "1.500") — otherwise
  // it's a decimal point (e.g. "1500.00").
  const withoutThousands = withoutStrayChars.replace(/\.(?=\d{3}(?:\D|$))/g, "");
  const normalized = withoutThousands.replace(",", ".");

  const asFloat = Number.parseFloat(normalized);
  if (Number.isNaN(asFloat)) return undefined;
  return Math.round(asFloat * 100);
}

export function formatCentsToBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

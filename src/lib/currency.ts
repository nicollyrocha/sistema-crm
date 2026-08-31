export function parseCurrencyToCents(input: string): number | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  const cleaned = trimmed.replace(/[^\d,.-]/g, "");
  if (!cleaned) return undefined;

  // Whichever of "," or "." appears last in the string is treated as the decimal
  // separator (this correctly handles both BR format "1.500,00" and US format
  // "1,500.00"); every other occurrence of either character is a thousands
  // grouping separator and gets stripped.
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalSeparatorIndex = Math.max(lastComma, lastDot);

  let normalized: string;
  if (decimalSeparatorIndex === -1) {
    normalized = cleaned;
  } else {
    const integerPart = cleaned.slice(0, decimalSeparatorIndex).replace(/[,.]/g, "");
    const decimalPart = cleaned.slice(decimalSeparatorIndex + 1);
    normalized = `${integerPart}.${decimalPart}`;
  }

  const asFloat = Number.parseFloat(normalized);
  if (Number.isNaN(asFloat)) return undefined;
  return Math.round(asFloat * 100);
}

export function formatCentsToBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

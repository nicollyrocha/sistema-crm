export function parseCurrencyToCents(input: string): number | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  const cleaned = trimmed.replace(/[^\d,.-]/g, "");
  if (!cleaned) return undefined;

  // When both "," and "." are present, whichever appears last is the decimal
  // separator (handles both BR format "1.500,00" and US format "1,500.00").
  // When only "," is present, it's always the decimal separator (BR convention
  // never uses comma for thousands grouping). When only "." is present, it's
  // ambiguous between a BR thousands separator ("1.500" = 1500) and a decimal
  // point ("1.50") — treat it as thousands grouping only when it's followed by
  // exactly 3 digits through the end of the string.
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  let decimalSeparatorIndex: number;
  if (lastComma !== -1 && lastDot !== -1) {
    decimalSeparatorIndex = Math.max(lastComma, lastDot);
  } else if (lastComma !== -1) {
    decimalSeparatorIndex = lastComma;
  } else if (lastDot !== -1) {
    const digitsAfterDot = cleaned.length - lastDot - 1;
    decimalSeparatorIndex = digitsAfterDot === 3 ? -1 : lastDot;
  } else {
    decimalSeparatorIndex = -1;
  }

  let normalized: string;
  if (decimalSeparatorIndex === -1) {
    normalized = cleaned.replace(/[,.]/g, "");
  } else {
    const integerPart = cleaned.slice(0, decimalSeparatorIndex).replace(/[,.]/g, "");
    const decimalPart = cleaned.slice(decimalSeparatorIndex + 1);
    normalized = `${integerPart}.${decimalPart}`;
  }

  // `Number()` (unlike `parseFloat`) rejects any trailing garbage instead of
  // silently parsing just a numeric prefix, so malformed input like "10-5" is
  // rejected rather than coerced into a wrong-but-plausible amount.
  const asFloat = Number(normalized);
  if (Number.isNaN(asFloat)) return undefined;
  return Math.round(asFloat * 100);
}

export function formatCentsToBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

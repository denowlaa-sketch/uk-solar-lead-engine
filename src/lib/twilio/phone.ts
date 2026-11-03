export function toE164Uk(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("+") && digits.length >= 11) return digits;
  if (digits.startsWith("44") && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith("0") && digits.length >= 10) return `+44${digits.slice(1)}`;
  return undefined;
}

export function isLikelyTestNumber(e164: string): boolean {
  const n = e164.replace(/\D/g, "");
  return n.includes("5550") || n.startsWith("447700900");
}

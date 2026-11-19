export function toE164(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("+") && digits.length >= 10) return digits;
  if (digits.startsWith("00") && digits.length >= 12) return `+${digits.slice(2)}`;
  if (digits.startsWith("44") && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith("0") && digits.length >= 10) return `+44${digits.slice(1)}`;
  if (/^\d{10,15}$/.test(digits)) return `+${digits}`;
  return undefined;
}

export const toE164Uk = toE164;

export function isLikelyTestNumber(e164: string): boolean {
  const n = e164.replace(/\D/g, "");
  return n.includes("5550") || n.startsWith("447700900");
}

export function digitsOnly(e164: string) {
  return e164.replace(/\D/g, "");
}

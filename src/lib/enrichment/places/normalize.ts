export function normalizePostcode(value: string | null | undefined): string {
  return (value ?? "").toUpperCase().replace(/\s+/g, "");
}

export function postcodeMatches(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizePostcode(a);
  const right = normalizePostcode(b);
  return Boolean(left && right && left === right);
}

export function stripCompanySuffix(name: string): string {
  return name
    .replace(/\b(limited|ltd|plc|llp|llc|inc|incorporated|holdings|group)\b\.?/gi, "")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeWebsite(value: string | null | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  let url = value.trim();
  if (url.startsWith("http://")) url = `https://${url.slice(7)}`;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes(".")) return undefined;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

export function normalizePhone(value: string | null | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  if (!/[0-9]/.test(trimmed)) return undefined;
  return trimmed;
}

export function textIncludesPostcode(text: string | null | undefined, postcode: string): boolean {
  if (!text) return false;
  const compact = normalizePostcode(text);
  const code = normalizePostcode(postcode);
  return Boolean(code && compact.includes(code));
}

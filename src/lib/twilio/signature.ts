import { createHmac, timingSafeEqual } from "crypto";
import { getTwilioAuthToken, getTwilioPublicBaseUrl } from "./env";

export async function readTwilioForm(request: Request): Promise<Record<string, string>> {
  const text = await request.text();
  const params = new URLSearchParams(text);
  const out: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    out[key] = value;
  }
  return out;
}

export function twilioWebhookUrl(pathname: string): string | undefined {
  const base = getTwilioPublicBaseUrl();
  if (!base) return undefined;
  return `${base}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function isValidTwilioSignature(url: string, params: Record<string, string>, signature: string | null) {
  const token = getTwilioAuthToken();
  if (!token || !signature) return false;
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  const expected = createHmac("sha1", token).update(data, "utf8").digest("base64");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

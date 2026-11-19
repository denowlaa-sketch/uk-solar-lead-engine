function readEnv(name: string): string | undefined {
  const fromProcess = (process.env[name] ?? "").trim();
  return fromProcess || undefined;
}

export function getFacebookVerifyToken(): string | undefined {
  return readEnv("FACEBOOK_VERIFY_TOKEN");
}

export function getFacebookPageAccessToken(): string | undefined {
  return readEnv("FACEBOOK_PAGE_ACCESS_TOKEN");
}

export function getFacebookFormId(): string | undefined {
  return readEnv("FACEBOOK_FORM_ID");
}

export function getFacebookAppSecret(): string | undefined {
  return readEnv("FACEBOOK_APP_SECRET");
}

export function allowFacebookSimulate(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return readEnv("FACEBOOK_ALLOW_SIMULATE") === "true";
}

export function getFacebookLeadsAfter(): Date | undefined {
  const raw = readEnv("FACEBOOK_LEADS_AFTER");
  if (!raw) return undefined;
  const parsed = /^\d+$/.test(raw) ? new Date(Number(raw) * 1000) : new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

export function getPublicWebhookBase(): string | undefined {
  const url = (readEnv("FACEBOOK_PUBLIC_BASE_URL") || readEnv("TWILIO_PUBLIC_BASE_URL") || "").replace(/\/$/, "");
  return url || undefined;
}

export function getLeadgenCallbackUrl(): string {
  const base = getPublicWebhookBase();
  return base ? `${base}/api/facebook/leadgen` : "/api/facebook/leadgen";
}

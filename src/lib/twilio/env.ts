function readEnv(name: string): string | undefined {
  const fromProcess = (process.env[name] ?? "").trim();
  return fromProcess || undefined;
}

export function getTwilioAccountSid(): string | undefined {
  return readEnv("TWILIO_ACCOUNT_SID");
}

export function getTwilioAuthToken(): string | undefined {
  return readEnv("TWILIO_AUTH_TOKEN");
}

export function getTwilioFromNumber(): string | undefined {
  return readEnv("TWILIO_PHONE_NUMBER");
}

export function getTwilioWhatsAppFrom(): string | undefined {
  const raw = readEnv("TWILIO_WHATSAPP_FROM");
  if (!raw) return undefined;
  return raw.startsWith("whatsapp:") ? raw : `whatsapp:${raw}`;
}

export function getTwilioWhatsAppContentSid(): string | undefined {
  return readEnv("TWILIO_WHATSAPP_CONTENT_SID");
}

export function getTwilioCallChannel(): "auto" | "whatsapp" | "phone" {
  const raw = (readEnv("TWILIO_CALL_CHANNEL") ?? "auto").toLowerCase();
  if (raw === "whatsapp" || raw === "phone") return raw;
  return "auto";
}

export function getTwilioPublicBaseUrl(): string | undefined {
  const url = readEnv("TWILIO_PUBLIC_BASE_URL");
  return url?.replace(/\/$/, "");
}

export function isTwilioLiveEnabled(): boolean {
  return (readEnv("TWILIO_LIVE_DIALS") ?? "").toLowerCase() === "true";
}

export function isTwilioConfigured(): boolean {
  return Boolean(
    getTwilioAccountSid() &&
      getTwilioAuthToken() &&
      (getTwilioFromNumber() || getTwilioWhatsAppFrom()) &&
      getTwilioPublicBaseUrl()
  );
}

export function twilioStatus() {
  const whatsappFrom = getTwilioWhatsAppFrom() ?? null;
  return {
    accountSidSet: Boolean(getTwilioAccountSid()),
    authTokenSet: Boolean(getTwilioAuthToken()),
    fromNumber: getTwilioFromNumber() ?? null,
    publicBaseUrl: getTwilioPublicBaseUrl() ?? null,
    liveEnabled: isTwilioLiveEnabled(),
    whatsappFrom,
    whatsappReady: Boolean(whatsappFrom),
    callChannel: getTwilioCallChannel(),
    ready: isTwilioConfigured() && isTwilioLiveEnabled(),
  };
}

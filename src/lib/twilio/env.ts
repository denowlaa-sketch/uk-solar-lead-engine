import { readFileSync } from "fs";
import { resolve } from "path";

function readEnv(name: string): string | undefined {
  const fromProcess = (process.env[name] ?? "").trim();
  if (fromProcess) return fromProcess;
  try {
    const text = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    const match = text.match(new RegExp(`^${name}\\s*=\\s*(.*)$`, "m"));
    if (!match) return undefined;
    return match[1].trim().replace(/^["']|["']$/g, "") || undefined;
  } catch {
    return undefined;
  }
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
      getTwilioFromNumber() &&
      getTwilioPublicBaseUrl()
  );
}

export function twilioStatus() {
  return {
    accountSidSet: Boolean(getTwilioAccountSid()),
    authTokenSet: Boolean(getTwilioAuthToken()),
    fromNumber: getTwilioFromNumber() ?? null,
    publicBaseUrl: getTwilioPublicBaseUrl() ?? null,
    liveEnabled: isTwilioLiveEnabled(),
    ready: isTwilioConfigured() && isTwilioLiveEnabled(),
  };
}

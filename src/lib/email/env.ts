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

export function getOwnerNotifyEmail(): string | undefined {
  return readEnv("OWNER_NOTIFY_EMAIL");
}

export function getResendApiKey(): string | undefined {
  return readEnv("RESEND_API_KEY");
}

export function getEmailFrom(): string {
  return readEnv("EMAIL_FROM") || "UK Solar Lead Engine <onboarding@resend.dev>";
}

export function isOwnerEmailConfigured(): boolean {
  return Boolean(getOwnerNotifyEmail() && getResendApiKey());
}

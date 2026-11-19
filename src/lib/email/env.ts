function readEnv(name: string): string | undefined {
  const fromProcess = (process.env[name] ?? "").trim();
  return fromProcess || undefined;
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

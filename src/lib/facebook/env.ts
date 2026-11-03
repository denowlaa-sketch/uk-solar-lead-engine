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

export function getFacebookVerifyToken(): string | undefined {
  return readEnv("FACEBOOK_VERIFY_TOKEN");
}

export function getFacebookPageAccessToken(): string | undefined {
  return readEnv("FACEBOOK_PAGE_ACCESS_TOKEN");
}

export function getFacebookAppSecret(): string | undefined {
  return readEnv("FACEBOOK_APP_SECRET");
}

export function allowFacebookSimulate(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return readEnv("FACEBOOK_ALLOW_SIMULATE") === "true";
}

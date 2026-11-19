import { prisma } from "../prisma";
import {
  getTwilioAccountSid,
  getTwilioAuthToken,
  getTwilioWhatsAppContentSid,
  getTwilioWhatsAppFrom,
} from "./env";
import { digitsOnly, toE164 } from "./phone";

function authHeader() {
  const sid = getTwilioAccountSid();
  const token = getTwilioAuthToken();
  if (!sid || !token) return null;
  return `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
}

export async function sendWhatsAppCallPermission(e164: string) {
  const from = getTwilioWhatsAppFrom();
  const contentSid = getTwilioWhatsAppContentSid();
  const sid = getTwilioAccountSid();
  const auth = authHeader();
  if (!from || !sid || !auth) {
    return { sent: false as const, reason: "WhatsApp sender is not configured (TWILIO_WHATSAPP_FROM)." };
  }
  if (!contentSid) {
    return {
      sent: false as const,
      reason: "TWILIO_WHATSAPP_CONTENT_SID is empty. Create a Voice Call Request template in Twilio.",
    };
  }

  const body = new URLSearchParams({
    From: from,
    To: `whatsapp:${e164}`,
    ContentSid: contentSid,
  });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = (await res.json()) as { sid?: string; message?: string };
  if (!res.ok || !json.sid) {
    return { sent: false as const, reason: json.message ?? `WhatsApp permission message failed (${res.status})` };
  }
  return { sent: true as const, messageSid: json.sid };
}

export async function findLeadIdByPhone(raw: string) {
  const e164 = toE164(raw.replace(/^whatsapp:/i, ""));
  if (!e164) return null;
  const digits = digitsOnly(e164);
  const leads = await prisma.lead.findMany({
    where: {
      source: "FACEBOOK",
      consentToCall: true,
      status: { in: ["NEW", "CONTACTED"] },
      contact: { is: { phone: { not: null } } },
    },
    include: { contact: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  const match = leads.find((lead) => {
    const stored = toE164(lead.contact?.phone);
    return stored && digitsOnly(stored) === digits;
  });
  return match?.id ?? null;
}

export async function handleWhatsAppInbound(params: Record<string, string>) {
  const from = params.From ?? "";
  const payload = `${params.ButtonPayload ?? ""} ${params.Body ?? ""}`.toUpperCase();
  const accepted = payload.includes("ACCEPT");

  if (!accepted) {
    return { ok: true as const, action: "ignored" as const };
  }

  const leadId = await findLeadIdByPhone(from);
  if (!leadId) {
    return { ok: true as const, action: "no_lead" as const };
  }

  const { startLiveDial } = await import("./place-call");
  const result = await startLiveDial(leadId, { channel: "whatsapp" });
  if ("error" in result) {
    return { ok: false as const, action: "dial_failed" as const, error: result.error };
  }
  return { ok: true as const, action: "dialled" as const, leadId };
}

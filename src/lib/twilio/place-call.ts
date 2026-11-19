import { prisma } from "../prisma";
import { startSandboxCall } from "../facebook/calls";
import {
  getTwilioAccountSid,
  getTwilioAuthToken,
  getTwilioCallChannel,
  getTwilioFromNumber,
  getTwilioWhatsAppFrom,
  isTwilioConfigured,
  isTwilioLiveEnabled,
} from "./env";
import { isLikelyTestNumber, toE164 } from "./phone";
import { twilioWebhookUrl } from "./signature";
import { sendWhatsAppCallPermission } from "./whatsapp";

type Channel = "whatsapp" | "phone";

export async function startLiveDial(leadId: string, options?: { channel?: Channel }) {
  if (!isTwilioConfigured()) {
    return {
      error:
        "Twilio is not fully set. Need TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, a From number, and TWILIO_PUBLIC_BASE_URL.",
    };
  }
  if (!isTwilioLiveEnabled()) {
    return {
      error: "Live dials are off. Set TWILIO_LIVE_DIALS=true in .env after you are ready to ring a real phone.",
    };
  }

  const started = await startSandboxCall(leadId, { live: true });
  if ("error" in started) return started;

  const attempt = await prisma.callAttempt.findUnique({ where: { id: started.attemptId } });
  if (!attempt) return { error: "Call attempt missing" as const };
  if (attempt.twilioCallSid && attempt.status === "IN_PROGRESS") {
    return { error: "A live call is already in progress for this lead", attemptId: attempt.id };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { contact: true },
  });
  const to = toE164(lead?.contact?.phone);
  if (!to) return { error: "Phone number is not a usable international number" as const };
  if (isLikelyTestNumber(to)) {
    return {
      error:
        "This number looks like sample/test data (555 or 07700 900). Put a real mobile on the lead before a live dial.",
    };
  }

  const voiceUrl = twilioWebhookUrl(`/api/twilio/voice/${attempt.id}/interested`);
  const statusUrl = twilioWebhookUrl(`/api/twilio/voice/${attempt.id}/status`);
  if (!voiceUrl || !statusUrl) return { error: "TWILIO_PUBLIC_BASE_URL is missing" as const };

  const preferred = options?.channel ?? getTwilioCallChannel();
  const order: Channel[] =
    preferred === "whatsapp"
      ? ["whatsapp"]
      : preferred === "phone"
        ? ["phone"]
        : getTwilioWhatsAppFrom()
          ? ["whatsapp", "phone"]
          : ["phone"];

  let lastError = "Could not place the call";
  for (const channel of order) {
    if (channel === "whatsapp") {
      const permission = await sendWhatsAppCallPermission(to);
      if (!permission.sent && order.length === 1) {
        lastError = permission.reason;
        continue;
      }
    }

    const from =
      channel === "whatsapp" ? getTwilioWhatsAppFrom() : getTwilioFromNumber();
    if (!from) {
      lastError = channel === "whatsapp" ? "TWILIO_WHATSAPP_FROM is missing" : "TWILIO_PHONE_NUMBER is missing";
      continue;
    }

    const placed = await placeTwilioCall({
      to: channel === "whatsapp" ? `whatsapp:${to}` : to,
      from,
      voiceUrl,
      statusUrl,
    });
    if (placed.ok) {
      await prisma.callAttempt.update({
        where: { id: attempt.id },
        data: {
          mode: "LIVE",
          twilioCallSid: placed.callSid,
          providerStatus: placed.status,
          summary: channel === "whatsapp" ? "Live WhatsApp call queued." : "Live phone call queued.",
        },
      });
      return { attemptId: attempt.id, callSid: placed.callSid, to, from, channel };
    }
    lastError = placed.error;
  }

  await prisma.callAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "BLOCKED",
      summary: lastError,
      endedAt: new Date(),
    },
  });
  return { error: lastError };
}

async function placeTwilioCall(input: {
  to: string;
  from: string;
  voiceUrl: string;
  statusUrl: string;
}) {
  const sid = getTwilioAccountSid()!;
  const token = getTwilioAuthToken()!;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const body = new URLSearchParams({
    To: input.to,
    From: input.from,
    Url: input.voiceUrl,
    Method: "POST",
    StatusCallback: input.statusUrl,
    StatusCallbackMethod: "POST",
    StatusCallbackEvent: "initiated ringing answered completed",
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = (await response.json()) as { sid?: string; message?: string; status?: string };
  if (!response.ok || !json.sid) {
    return { ok: false as const, error: json.message ?? `Twilio ${response.status}` };
  }
  return { ok: true as const, callSid: json.sid, status: json.status ?? "queued" };
}

export async function maybeAutoDialAfterIngest(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { contact: true },
  });
  if (!lead) return { dialled: false as const, reason: "Lead not found" };
  if (!lead.consentToCall) {
    return { dialled: false as const, reason: "No call consent — bot must not dial" };
  }
  if (!lead.contact?.phone) {
    return { dialled: false as const, reason: "No phone number" };
  }
  if (!isTwilioConfigured() || !isTwilioLiveEnabled()) {
    return {
      dialled: false as const,
      reason: "Twilio live dials are not on. Lead is in the call queue.",
    };
  }

  const result = await startLiveDial(leadId);
  if ("error" in result) {
    return { dialled: false as const, reason: result.error };
  }
  return { dialled: true as const, ...result };
}

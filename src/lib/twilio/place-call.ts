import { prisma } from "../prisma";
import { startSandboxCall } from "../facebook/calls";
import {
  getTwilioAccountSid,
  getTwilioAuthToken,
  getTwilioFromNumber,
  isTwilioConfigured,
  isTwilioLiveEnabled,
} from "./env";
import { isLikelyTestNumber, toE164Uk } from "./phone";
import { twilioWebhookUrl } from "./signature";

export async function startLiveDial(leadId: string) {
  if (!isTwilioConfigured()) {
    return {
      error:
        "Twilio is not fully set. Need TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, and TWILIO_PUBLIC_BASE_URL.",
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
  const to = toE164Uk(lead?.contact?.phone);
  if (!to) return { error: "Phone number is not a usable UK number" as const };
  if (isLikelyTestNumber(to)) {
    return {
      error:
        "This number looks like sample/test data (555 or 07700 900). Put your own verified mobile on a test lead before a live dial.",
    };
  }

  const voiceUrl = twilioWebhookUrl(`/api/twilio/voice/${attempt.id}/interested`);
  const statusUrl = twilioWebhookUrl(`/api/twilio/voice/${attempt.id}/status`);
  if (!voiceUrl || !statusUrl) return { error: "TWILIO_PUBLIC_BASE_URL is missing" as const };

  const sid = getTwilioAccountSid()!;
  const token = getTwilioAuthToken()!;
  const from = getTwilioFromNumber()!;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const body = new URLSearchParams({
    To: to,
    From: from,
    Url: voiceUrl,
    Method: "POST",
    StatusCallback: statusUrl,
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
    await prisma.callAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "BLOCKED",
        summary: json.message ?? `Twilio rejected the call (${response.status})`,
        providerStatus: json.status ?? String(response.status),
        endedAt: new Date(),
      },
    });
    return { error: json.message ?? `Twilio ${response.status}` };
  }

  await prisma.callAttempt.update({
    where: { id: attempt.id },
    data: {
      mode: "LIVE",
      twilioCallSid: json.sid,
      providerStatus: json.status ?? "queued",
    },
  });

  return { attemptId: attempt.id, callSid: json.sid, to, from };
}

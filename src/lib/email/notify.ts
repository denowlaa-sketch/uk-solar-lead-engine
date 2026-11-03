import { prisma } from "../prisma";
import { getEmailFrom, getOwnerNotifyEmail, getResendApiKey } from "./env";

export type NotifyResult = {
  notificationId: string;
  sent: boolean;
  status: "sent" | "sandbox" | "failed";
  error?: string;
};

async function sendViaResend(to: string, subject: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const key = getResendApiKey();
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set" };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: [to],
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { ok: false, error: `Resend ${response.status}: ${body.slice(0, 200)}` };
  }
  return { ok: true };
}

export async function notifyOwnerOfQualifiedLead(leadId: string): Promise<NotifyResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { company: true, contact: true },
  });
  if (!lead) throw new Error("Lead not found");

  const name = `${lead.contact?.firstName ?? ""} ${lead.contact?.lastName ?? ""}`.trim() || lead.company.name;
  const toAddress = getOwnerNotifyEmail() ?? null;
  const subject = `Qualified solar lead: ${name}`;
  const body = [
    `${name} passed the qualification call.`,
    `Phone: ${lead.contact?.phone ?? "unknown"}`,
    `Email: ${lead.contact?.email ?? "unknown"}`,
    `Postcode: ${lead.company.postcode}`,
    `Score: ${lead.score}`,
    `Status: ${lead.status}`,
    "",
    "The customer was not emailed. No live phone call was placed unless you ran one separately.",
  ].join("\n");

  const canSend = Boolean(toAddress && getResendApiKey());
  let status: NotifyResult["status"] = canSend ? "sent" : "sandbox";
  let error: string | undefined;
  let sentAt: Date | null = null;

  if (canSend && toAddress) {
    const result = await sendViaResend(toAddress, subject, body);
    if (result.ok) {
      sentAt = new Date();
      status = "sent";
    } else {
      status = "failed";
      error = result.error;
    }
  }

  const notification = await prisma.ownerNotification.create({
    data: {
      leadId,
      channel: "email",
      status,
      toAddress,
      subject,
      body: error ? `${body}\n\nSend error: ${error}` : body,
      sentAt,
    },
  });

  return { notificationId: notification.id, sent: status === "sent", status, error };
}

export function ownerEmailStatus() {
  const to = getOwnerNotifyEmail();
  const key = Boolean(getResendApiKey());
  return {
    toAddress: to ?? null,
    resendConfigured: key,
    ready: Boolean(to && key),
  };
}

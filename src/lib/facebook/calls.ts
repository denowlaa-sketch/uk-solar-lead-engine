import { prisma } from "../prisma";
import { notifyOwnerOfQualifiedLead } from "../email/notify";
import { qualifyFacebookLead } from "./qualify";
import { BILL_BAND_TO_MONTHLY } from "./types";
import type { FacebookFormAnswers } from "./types";

export type SandboxCallAnswers = {
  stillInterested: boolean;
  homeowner: boolean;
  billBand?: string;
  timeline?: string;
  roofOk: boolean;
  followUpOk: boolean;
  notes?: string;
};

export function evaluateCallOutcome(answers: SandboxCallAnswers): {
  outcome: "QUALIFIED" | "UNQUALIFIED";
  summary: string;
} {
  if (!answers.stillInterested) {
    return { outcome: "UNQUALIFIED", summary: "Not interested on the call." };
  }
  if (!answers.homeowner) {
    return { outcome: "UNQUALIFIED", summary: "Not a homeowner — cannot install." };
  }
  if (!answers.roofOk) {
    return { outcome: "UNQUALIFIED", summary: "Roof not suitable." };
  }
  if (!answers.followUpOk) {
    return { outcome: "UNQUALIFIED", summary: "Declined advisor follow-up." };
  }
  if (answers.billBand === "under_50") {
    return { outcome: "UNQUALIFIED", summary: "Bill too low for a typical rooftop payback." };
  }
  return {
    outcome: "QUALIFIED",
    summary: "Call passed: homeowner, suitable roof, follow-up accepted.",
  };
}

export async function getCallQueue() {
  return prisma.lead.findMany({
    where: {
      source: "FACEBOOK",
      consentToCall: true,
      status: { in: ["NEW", "CONTACTED"] },
      contact: { is: { phone: { not: null } } },
    },
    include: {
      company: true,
      contact: true,
      callAttempts: { orderBy: { startedAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getLeadForCall(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      company: true,
      contact: true,
      callAttempts: { orderBy: { startedAt: "desc" } },
      notifications: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function startSandboxCall(leadId: string, options?: { live?: boolean }) {
  const live = options?.live === true;
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { contact: true },
  });
  if (!lead) return { error: "Lead not found" as const };
  if (lead.source !== "FACEBOOK") return { error: "Call queue is for Facebook leads" as const };
  if (!lead.consentToCall) return { error: "No call consent — bot must not dial" as const };
  if (!lead.contact?.phone) return { error: "No phone number on the lead" as const };
  if (lead.status === "WON" || lead.status === "LOST") {
    return { error: "Lead is already closed" as const };
  }

  const open = await prisma.callAttempt.findFirst({
    where: { leadId, status: "IN_PROGRESS" },
    orderBy: { startedAt: "desc" },
  });
  if (open) {
    if (live && open.mode !== "LIVE") {
      await prisma.callAttempt.update({ where: { id: open.id }, data: { mode: "LIVE" } });
    }
    return { attemptId: open.id };
  }

  const attempt = await prisma.callAttempt.create({
    data: {
      leadId,
      mode: live ? "LIVE" : "SANDBOX",
      status: "IN_PROGRESS",
    },
  });

  if (lead.status === "NEW") {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: "CONTACTED",
        notes: [
          lead.notes,
          live
            ? "Live Twilio call started. Customer was not emailed."
            : "Sandbox call started. No live phone call was placed.",
        ]
          .filter(Boolean)
          .join(" "),
      },
    });
  }

  return { attemptId: attempt.id };
}

export async function completeSandboxCall(
  leadId: string,
  answers: SandboxCallAnswers,
  outcomeOverride?: "NO_ANSWER" | "CALLBACK",
  options?: { attemptId?: string; live?: boolean }
) {
  const live = options?.live === true;
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { contact: true, company: true },
  });
  if (!lead) return { error: "Lead not found" as const };
  if (!lead.consentToCall && !outcomeOverride) {
    return { error: "No call consent" as const };
  }

  const evaluated = outcomeOverride
    ? {
        outcome: outcomeOverride,
        summary: live
          ? outcomeOverride === "NO_ANSWER"
            ? "Live call: no answer or busy."
            : "Live call: hung up or asked for a callback."
          : outcomeOverride === "NO_ANSWER"
            ? "Sandbox: no answer. No live call was placed."
            : "Sandbox: requested a callback. No live call was placed.",
      }
    : {
        ...evaluateCallOutcome(answers),
        summary: live
          ? evaluateCallOutcome(answers).summary.replace(/^Call passed/, "Live call passed")
          : `Sandbox ${evaluateCallOutcome(answers).summary.charAt(0).toLowerCase()}${evaluateCallOutcome(answers).summary.slice(1)}`,
      };

  const open = options?.attemptId
    ? await prisma.callAttempt.findUnique({ where: { id: options.attemptId } })
    : await prisma.callAttempt.findFirst({
        where: { leadId, status: "IN_PROGRESS" },
        orderBy: { startedAt: "desc" },
      });

  if (open?.status === "COMPLETED") {
    return {
      attemptId: open.id,
      outcome: open.outcome,
      status: lead.status,
      alreadyCompleted: true as const,
    };
  }

  const attempt = open
    ? await prisma.callAttempt.update({
        where: { id: open.id },
        data: {
          status: "COMPLETED",
          outcome: evaluated.outcome,
          answers: JSON.stringify(answers),
          summary: evaluated.summary,
          endedAt: new Date(),
        },
      })
    : await prisma.callAttempt.create({
        data: {
          leadId,
          mode: live ? "LIVE" : "SANDBOX",
          status: "COMPLETED",
          outcome: evaluated.outcome,
          answers: JSON.stringify(answers),
          summary: evaluated.summary,
          endedAt: new Date(),
        },
      });

  const formAnswers: FacebookFormAnswers = {
    firstName: lead.contact?.firstName ?? "Unknown",
    lastName: lead.contact?.lastName ?? "Lead",
    email: lead.contact?.email ?? undefined,
    phone: lead.contact?.phone ?? undefined,
    postcode: lead.company.postcode,
    city: lead.company.city,
    homeowner: answers.homeowner,
    billBand: answers.billBand ?? lead.billBand ?? undefined,
    roofType: lead.roofType ?? undefined,
    timeline: answers.timeline ?? lead.timeline ?? undefined,
    consentToCall: lead.consentToCall,
  };
  const qualification = qualifyFacebookLead(formAnswers);

  const nextStatus =
    evaluated.outcome === "QUALIFIED"
      ? "QUALIFIED"
      : evaluated.outcome === "UNQUALIFIED"
        ? "LOST"
        : "CONTACTED";

  const monthly = formAnswers.billBand ? BILL_BAND_TO_MONTHLY[formAnswers.billBand] : undefined;

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: {
        status: nextStatus,
        homeowner: answers.homeowner,
        billBand: formAnswers.billBand,
        timeline: formAnswers.timeline,
        score: qualification.score,
        category: qualification.category,
        qualificationLabel: qualification.qualificationLabel,
        solarSuitability: qualification.solarSuitability,
        lastAnalysedAt: new Date(),
        notes: [
          lead.notes,
          evaluated.summary,
          live ? "Customer was not emailed." : "No live phone call. Customer was not emailed.",
        ]
          .filter(Boolean)
          .join(" "),
      },
    }),
    prisma.company.update({
      where: { id: lead.companyId },
      data: { energyBillMonthly: monthly ?? lead.company.energyBillMonthly },
    }),
    prisma.leadAnalysis.create({
      data: {
        leadId,
        score: qualification.score,
        category: qualification.category,
        qualificationLabel: qualification.qualificationLabel,
        solarSuitability: qualification.solarSuitability,
        reasons: JSON.stringify(qualification.reasons),
        unknowns: JSON.stringify(qualification.unknowns),
        pipelineVersion: "residential-call-1.0",
      },
    }),
  ]);

  let notification: Awaited<ReturnType<typeof notifyOwnerOfQualifiedLead>> | undefined;
  if (evaluated.outcome === "QUALIFIED") {
    notification = await notifyOwnerOfQualifiedLead(leadId);
  }

  return {
    attemptId: attempt.id,
    outcome: evaluated.outcome,
    status: nextStatus,
    notificationId: notification?.notificationId,
    sentEmail: notification?.sent ?? false,
    emailStatus: notification?.status,
    emailError: notification?.error,
  };
}

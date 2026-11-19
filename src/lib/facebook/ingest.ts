import { prisma } from "../prisma";
import { maybeAutoDialAfterIngest } from "../twilio/place-call";
import { qualifyFacebookLead } from "./qualify";
import type { FacebookFormAnswers } from "./types";
import { BILL_BAND_TO_MONTHLY } from "./types";

function isDummyFacebookLead(answers: FacebookFormAnswers) {
  const blob = [
    answers.firstName,
    answers.lastName,
    answers.phone,
    answers.email,
    answers.streetAddress,
    answers.postcode,
    answers.city,
    answers.facebookLeadId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (blob.includes("dummy data") || blob.includes("<test lead")) return true;
  if (answers.facebookLeadId?.startsWith("seed_fb_")) return true;

  const digits = (answers.phone ?? "").replace(/\D/g, "");
  if (/447700900(111|222|333|123|456|789)$/.test(digits)) return true;
  if (/447700900111|447700900222|447700900333/.test(digits)) return true;

  return false;
}

export async function ingestFacebookLead(answers: FacebookFormAnswers) {
  if (isDummyFacebookLead(answers)) {
    return { leadId: "", duplicate: true as const, skippedDummy: true as const };
  }

  if (answers.facebookLeadId) {
    const existing = await prisma.lead.findUnique({
      where: { facebookLeadId: answers.facebookLeadId },
    });
    if (existing) {
      return { leadId: existing.id, duplicate: true as const };
    }
  }

  const displayName = `${answers.firstName} ${answers.lastName}`.trim();
  const qualification = qualifyFacebookLead(answers);
  const monthly = answers.billBand ? BILL_BAND_TO_MONTHLY[answers.billBand] : undefined;

  const company = await prisma.company.create({
    data: {
      name: `${displayName} household`,
      address: answers.streetAddress,
      postcode: answers.postcode,
      city: answers.city?.trim() || "Unknown",
      industry: "Residential",
      energyBillMonthly: monthly,
    },
  });

  const contact = await prisma.contact.create({
    data: {
      companyId: company.id,
      firstName: answers.firstName,
      lastName: answers.lastName,
      email: answers.email,
      phone: answers.phone,
      jobTitle: "Homeowner enquiry",
      isPrimary: true,
    },
  });

  const lead = await prisma.lead.create({
    data: {
      companyId: company.id,
      contactId: contact.id,
      status: "NEW",
      source: "FACEBOOK",
      score: qualification.score,
      category: qualification.category,
      qualificationLabel: qualification.qualificationLabel,
      solarSuitability: qualification.solarSuitability,
      lastAnalysedAt: new Date(),
      homeowner: answers.homeowner ?? null,
      billBand: answers.billBand,
      roofType: answers.roofType,
      timeline: answers.timeline,
      consentToCall: answers.consentToCall,
      consentAt: answers.consentToCall ? new Date() : null,
      facebookLeadId: answers.facebookLeadId,
      facebookFormId: answers.facebookFormId,
      facebookPageId: answers.facebookPageId,
      formPayload: JSON.stringify(answers.raw ?? answers),
      notes: answers.consentToCall
        ? "Facebook Instant Form lead. Consented to call."
        : "Facebook Instant Form lead. No call consent — do not dial. No email sent.",
    },
  });

  await prisma.leadAnalysis.create({
    data: {
      leadId: lead.id,
      score: qualification.score,
      category: qualification.category,
      qualificationLabel: qualification.qualificationLabel,
      solarSuitability: qualification.solarSuitability,
      reasons: JSON.stringify(qualification.reasons),
      unknowns: JSON.stringify(qualification.unknowns),
      pipelineVersion: qualification.pipelineVersion,
    },
  });

  const dial = answers.consentToCall
    ? await maybeAutoDialAfterIngest(lead.id)
    : { dialled: false as const, reason: "No call consent — do not dial" };

  if (dial.dialled) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        notes: [lead.notes, "Twilio auto-call queued after Instant Form."].filter(Boolean).join(" "),
      },
    });
  } else if (answers.consentToCall) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        notes: [lead.notes, `Auto-call not placed: ${dial.reason}`].filter(Boolean).join(" "),
      },
    });
  }

  return { leadId: lead.id, duplicate: false as const, qualification, dial };
}

export async function getFacebookLeads() {
  return prisma.lead.findMany({
    where: { source: "FACEBOOK" },
    include: { company: true, contact: true, analyses: { orderBy: { ranAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
}

import { prisma } from "../prisma";
import { qualifyFacebookLead } from "./qualify";
import type { FacebookFormAnswers } from "./types";
import { BILL_BAND_TO_MONTHLY } from "./types";

export async function ingestFacebookLead(answers: FacebookFormAnswers) {
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
        ? "Facebook Instant Form lead. Consented to call. No call or email has been sent yet."
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

  return { leadId: lead.id, duplicate: false as const, qualification };
}

export async function getFacebookLeads() {
  return prisma.lead.findMany({
    where: { source: "FACEBOOK" },
    include: { company: true, contact: true, analyses: { orderBy: { ranAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
}

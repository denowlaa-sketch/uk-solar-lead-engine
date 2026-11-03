import type { DiscoveryProspect, Lead } from "@prisma/client";
import { prisma } from "../prisma";
import { enrichFactsInMemory } from "../analysis/enrich";
import { runLeadAnalysis } from "../analysis/pipeline";
import { runScoringEngine } from "../analysis/scorer";
import type { AnalysisResult } from "../analysis/types";
import { lookupPlaces, placesNote } from "@/lib/enrichment/places";
import { DISCOVERY_PROSPECTS } from "./prospects";

function emptyLeadStub(): Lead {
  return {
    id: "preview",
    companyId: "preview",
    contactId: null,
    status: "NEW",
    score: 0,
    category: null,
    qualificationLabel: "NOT_ANALYSED",
    source: "AI_DISCOVERY",
    notes: null,
    assignedTo: null,
    estimatedKw: null,
    estimatedKwSource: "UNKNOWN",
    solarSuitability: "UNKNOWN",
    lastAnalysedAt: null,
    homeowner: null,
    billBand: null,
    roofType: null,
    timeline: null,
    consentToCall: false,
    consentAt: null,
    facebookLeadId: null,
    facebookFormId: null,
    facebookPageId: null,
    formPayload: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function previewProspectScore(prospect: DiscoveryProspect): AnalysisResult {
  const facts = enrichFactsInMemory({
    lead: {
      ...emptyLeadStub(),
      notes: prospect.notes,
      estimatedKw: null,
    },
    company: {
      id: "preview",
      name: prospect.name,
      companyNumber: prospect.companyNumber,
      address: prospect.address,
      postcode: prospect.postcode,
      city: prospect.city,
      county: prospect.county,
      industry: prospect.industry,
      employeeCount: prospect.employeeCount,
      annualRevenue: prospect.annualRevenue,
      roofSizeSqm: prospect.roofSizeSqm,
      energyBillMonthly: prospect.energyBillMonthly,
      annualKwhUsage: null,
      annualKwhSource: "UNKNOWN",
      irradianceKwhPerKwp: null,
      irradianceSource: "UNKNOWN",
      irradianceRegion: null,
      lastEnrichedAt: null,
      website: prospect.website,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    contact:
      prospect.contactFirstName && prospect.contactLastName
        ? {
            id: "preview",
            companyId: "preview",
            firstName: prospect.contactFirstName,
            lastName: prospect.contactLastName,
            email: prospect.contactEmail,
            phone: prospect.contactPhone,
            jobTitle: prospect.contactJobTitle,
            isPrimary: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : null,
  });

  return runScoringEngine(facts);
}

export async function listDiscoveryProspects() {
  const prospects = await prisma.discoveryProspect.findMany({
    orderBy: [{ fetchedAt: "desc" }, { name: "asc" }],
  });

  return prospects.map((prospect) => ({
    ...prospect,
    preview: prospect.importedAt ? null : previewProspectScore(prospect),
  }));
}

export async function importProspect(id: string) {
  const prospect = await prisma.discoveryProspect.findUnique({ where: { id } });
  if (!prospect) return { error: "Prospect not found" as const };
  if (prospect.importedAt) return { error: "Already imported" as const };

  if (prospect.companyNumber) {
    const existing = await prisma.company.findUnique({
      where: { companyNumber: prospect.companyNumber },
    });
    if (existing) return { error: "This company is already in the pipeline" as const };
  }

  let website = prospect.website;
  let contactPhone = prospect.contactPhone;
  let notes = prospect.notes ?? "Imported from discovery scan.";

  if (!website || !contactPhone) {
    try {
      const places = await lookupPlaces({
        name: prospect.name,
        postcode: prospect.postcode,
        city: prospect.city,
      });
      website = website || places.website || null;
      contactPhone = contactPhone || places.phone || null;
      if (places.matched) {
        notes = `${notes} ${placesNote(places)}`.trim();
        await prisma.discoveryProspect.update({
          where: { id },
          data: { website, contactPhone, notes },
        });
      }
    } catch {
      /* keep unknown website/phone */
    }
  }

  const company = await prisma.company.create({
    data: {
      name: prospect.name,
      companyNumber: prospect.companyNumber,
      address: prospect.address,
      postcode: prospect.postcode,
      city: prospect.city,
      county: prospect.county,
      industry: prospect.industry,
      employeeCount: prospect.employeeCount,
      annualRevenue: prospect.annualRevenue,
      roofSizeSqm: prospect.roofSizeSqm,
      energyBillMonthly: prospect.energyBillMonthly,
      website,
    },
  });

  const hasContact = prospect.contactFirstName && prospect.contactLastName;
  const contact = hasContact
    ? await prisma.contact.create({
        data: {
          companyId: company.id,
          firstName: prospect.contactFirstName!,
          lastName: prospect.contactLastName!,
          email: prospect.contactEmail,
          phone: contactPhone,
          jobTitle: prospect.contactJobTitle,
          isPrimary: true,
        },
      })
    : null;

  const lead = await prisma.lead.create({
    data: {
      companyId: company.id,
      contactId: contact?.id,
      status: "NEW",
      source: "AI_DISCOVERY",
      notes,
    },
  });

  await prisma.discoveryProspect.update({
    where: { id },
    data: { importedAt: new Date(), importedLeadId: lead.id },
  });

  const analysis = await runLeadAnalysis(lead.id);

  return { leadId: lead.id, analysis };
}

export async function seedDiscoveryProspects() {
  await prisma.discoveryProspect.deleteMany();
  await prisma.discoveryProspect.createMany({
    data: DISCOVERY_PROSPECTS,
  });
}

import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { lookupIrradiance } from "../enrichment/irradiance";
import { estimateKwFromRoof } from "../enrichment/roof";
import type { LeadFacts } from "./types";

/**
 * Research / enrichment stage (v2.0).
 *
 * Fills only fields that can be derived from known inputs:
 * - Regional irradiance from UK postcode area (always ESTIMATED)
 * - Roof kW capacity when roof size is known and estimatedKw is missing
 *
 * Never invents energy bills, kWh usage, revenue, website, or contacts.
 */
export async function enrichFacts(facts: LeadFacts): Promise<LeadFacts> {
  const companyData: Prisma.CompanyUpdateInput = {};
  const leadData: Prisma.LeadUpdateInput = {};

  if (facts.company.irradianceKwhPerKwp == null) {
    const irradiance = lookupIrradiance(facts.company.postcode);
    if (irradiance) {
      companyData.irradianceKwhPerKwp = irradiance.kwhPerKwp;
      companyData.irradianceSource = "ESTIMATED";
      companyData.irradianceRegion = irradiance.region;
    }
  }

  if (facts.lead.estimatedKw == null) {
    const fromRoof = estimateKwFromRoof(facts.company.roofSizeSqm);
    if (fromRoof != null) {
      leadData.estimatedKw = fromRoof;
      leadData.estimatedKwSource = "ESTIMATED";
    }
  }

  companyData.lastEnrichedAt = new Date();

  await prisma.$transaction([
    prisma.company.update({
      where: { id: facts.company.id },
      data: companyData,
    }),
    prisma.lead.update({
      where: { id: facts.lead.id },
      data: leadData,
    }),
  ]);

  const lead = await prisma.lead.findUnique({
    where: { id: facts.lead.id },
    include: { company: true, contact: true },
  });

  if (!lead) return facts;

  return {
    lead,
    company: lead.company,
    contact: lead.contact,
  };
}

export function enrichFactsInMemory(facts: LeadFacts): LeadFacts {
  const company = { ...facts.company };
  const lead = { ...facts.lead };

  if (company.irradianceKwhPerKwp == null) {
    const irradiance = lookupIrradiance(company.postcode);
    if (irradiance) {
      company.irradianceKwhPerKwp = irradiance.kwhPerKwp;
      company.irradianceSource = "ESTIMATED";
      company.irradianceRegion = irradiance.region;
    }
  }

  if (lead.estimatedKw == null) {
    const fromRoof = estimateKwFromRoof(company.roofSizeSqm);
    if (fromRoof != null) {
      lead.estimatedKw = fromRoof;
      lead.estimatedKwSource = "ESTIMATED";
    }
  }

  return { ...facts, company, lead };
}

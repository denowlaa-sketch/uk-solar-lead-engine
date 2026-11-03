import type { Company, Contact, Lead } from "@prisma/client";
import { prisma } from "../prisma";
import { enrichFacts } from "./enrich";
import { runScoringEngine } from "./scorer";
import type { AnalysisResult, LeadFacts } from "./types";

export const PIPELINE_VERSION = "2.0";

export type LeadWithRelations = Lead & {
  company: Company;
  contact: Contact | null;
};

async function collectFacts(leadId: string): Promise<LeadFacts | null> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { company: true, contact: true },
  });

  if (!lead) return null;

  return {
    lead,
    company: lead.company,
    contact: lead.contact,
  };
}

async function persistAnalysis(leadId: string, result: AnalysisResult) {
  await prisma.$transaction([
    prisma.leadAnalysis.create({
      data: {
        leadId,
        score: result.score,
        category: result.category,
        qualificationLabel: result.qualificationLabel,
        solarSuitability: result.solarSuitability,
        reasons: JSON.stringify(result.reasons),
        unknowns: JSON.stringify(result.unknowns),
        pipelineVersion: result.pipelineVersion,
      },
    }),
    prisma.lead.update({
      where: { id: leadId },
      data: {
        score: result.score,
        category: result.category,
        qualificationLabel: result.qualificationLabel,
        solarSuitability: result.solarSuitability,
        lastAnalysedAt: new Date(),
      },
    }),
  ]);
}

/**
 * Automated research pipeline:
 * 1. Collect facts from the database
 * 2. Enrich (stub — expand later, never guess)
 * 3. Score 0–100 with reasons + unknowns
 * 4. Persist analysis history on the lead
 */
export async function runLeadAnalysis(leadId: string): Promise<AnalysisResult | null> {
  const facts = await collectFacts(leadId);
  if (!facts) return null;

  const enriched = await enrichFacts(facts);
  const result = runScoringEngine(enriched);
  result.pipelineVersion = PIPELINE_VERSION;

  await persistAnalysis(leadId, result);
  return result;
}

export async function runBulkAnalysis(): Promise<{ analysed: number; failed: number }> {
  const leads = await prisma.lead.findMany({ select: { id: true } });
  let analysed = 0;
  let failed = 0;

  for (const { id } of leads) {
    try {
      const result = await runLeadAnalysis(id);
      if (result) analysed++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return { analysed, failed };
}

export function parseAnalysisReasons(json: string) {
  try {
    return JSON.parse(json) as AnalysisResult["reasons"];
  } catch {
    return [];
  }
}

export function parseAnalysisUnknowns(json: string) {
  try {
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}

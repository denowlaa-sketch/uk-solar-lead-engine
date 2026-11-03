import type {
  Company,
  Contact,
  Lead,
  LeadCategory,
  QualificationLabel,
  SolarSuitability,
} from "@prisma/client";

export type AnalysisReason = {
  factor: string;
  impact: number;
  detail: string;
  known: boolean;
};

export type LeadFacts = {
  lead: Lead;
  company: Company;
  contact: Contact | null;
};

export type AnalysisResult = {
  score: number;
  category: LeadCategory;
  qualificationLabel: QualificationLabel;
  solarSuitability: SolarSuitability;
  reasons: AnalysisReason[];
  unknowns: string[];
  pipelineVersion: string;
};

export type PipelineStageName =
  | "collect_facts"
  | "enrich"
  | "score"
  | "persist";

import type { LeadCategory, QualificationLabel } from "@prisma/client";

export type DiscoveryPreview = {
  score: number;
  category: LeadCategory;
  qualificationLabel: QualificationLabel;
  unknowns: string[];
};

export type DiscoveryListItem = {
  id: string;
  name: string;
  companyNumber: string | null;
  city: string;
  postcode: string;
  industry: string;
  website: string | null;
  contactPhone: string | null;
  roofSizeSqm: number | null;
  energyBillMonthly: number | null;
  notes: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  importedAt: Date | null;
  importedLeadId: string | null;
  preview: DiscoveryPreview | null;
};

import type { LeadCategory, LeadStatus, QualificationLabel } from "@prisma/client";
import { prisma } from "./prisma";

export type LeadFilters = {
  status?: LeadStatus;
  category?: LeadCategory;
  qualification?: QualificationLabel;
  search?: string;
  minScore?: number;
};

function buildLeadWhere(filters?: LeadFilters) {
  const where: {
    status?: LeadStatus;
    category?: LeadCategory;
    qualificationLabel?: QualificationLabel;
    score?: { gte: number };
    OR?: Array<{
      company?: { name?: { contains: string }; city?: { contains: string } };
      contact?: {
        firstName?: { contains: string };
        lastName?: { contains: string };
        email?: { contains: string };
        phone?: { contains: string };
      };
      notes?: { contains: string };
    }>;
  } = {};

  if (filters?.status) where.status = filters.status;
  if (filters?.category) where.category = filters.category;
  if (filters?.qualification) where.qualificationLabel = filters.qualification;
  if (filters?.minScore != null) where.score = { gte: filters.minScore };

  if (filters?.search) {
    const search = filters.search;
    where.OR = [
      { company: { name: { contains: search } } },
      { company: { city: { contains: search } } },
      { contact: { firstName: { contains: search } } },
      { contact: { lastName: { contains: search } } },
      { contact: { email: { contains: search } } },
      { contact: { phone: { contains: search } } },
      { notes: { contains: search } },
    ];
  }

  return where;
}

export async function getDashboardStats() {
  const [totalLeads, totalCompanies, totalContacts, leads, statusCounts, categoryCounts, qualificationCounts] =
    await Promise.all([
      prisma.lead.count(),
      prisma.company.count(),
      prisma.contact.count(),
      prisma.lead.findMany({
        select: { score: true, status: true, category: true, qualificationLabel: true, source: true, consentToCall: true },
      }),
      prisma.lead.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.lead.groupBy({ by: ["category"], _count: { category: true } }),
      prisma.lead.groupBy({ by: ["qualificationLabel"], _count: { qualificationLabel: true } }),
    ]);

  const analysedLeads = leads.filter((l) => l.qualificationLabel !== "NOT_ANALYSED");
  const avgScore =
    analysedLeads.length > 0
      ? Math.round(analysedLeads.reduce((sum, l) => sum + l.score, 0) / analysedLeads.length)
      : 0;

  const qualifiedCount = leads.filter(
    (l) => l.status === "QUALIFIED" || l.status === "PROPOSAL" || l.status === "NEGOTIATION"
  ).length;

  const wonCount = leads.filter((l) => l.status === "WON").length;
  const aTierCount = leads.filter((l) => l.category === "A").length;
  const facebookCount = leads.filter((l) => l.source === "FACEBOOK").length;
  const consentedCount = leads.filter((l) => l.source === "FACEBOOK" && l.consentToCall).length;

  const scoreBuckets = [
    { label: "80–100", min: 80, max: 100, count: 0 },
    { label: "60–79", min: 60, max: 79, count: 0 },
    { label: "40–59", min: 40, max: 59, count: 0 },
    { label: "0–39", min: 0, max: 39, count: 0 },
  ];

  for (const lead of analysedLeads) {
    const bucket = scoreBuckets.find((b) => lead.score >= b.min && lead.score <= b.max);
    if (bucket) bucket.count++;
  }

  return {
    totalLeads,
    totalCompanies,
    totalContacts,
    avgScore,
    qualifiedCount,
    wonCount,
    aTierCount,
    facebookCount,
    consentedCount,
    analysedCount: analysedLeads.length,
    statusCounts: statusCounts.map((s) => ({ status: s.status, count: s._count.status })),
    categoryCounts: categoryCounts
      .filter((c) => c.category != null)
      .map((c) => ({ category: c.category!, count: c._count.category })),
    qualificationCounts: qualificationCounts.map((q) => ({
      qualification: q.qualificationLabel,
      count: q._count.qualificationLabel,
    })),
    scoreBuckets,
  };
}

export async function getLeads(filters?: LeadFilters) {
  return prisma.lead.findMany({
    where: buildLeadWhere(filters),
    include: {
      company: true,
      contact: true,
      analyses: { orderBy: { ranAt: "desc" }, take: 1 },
    },
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getLeadById(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      company: { include: { contacts: true } },
      contact: true,
      analyses: { orderBy: { ranAt: "desc" } },
    },
  });
}

export async function getCompanies() {
  return prisma.company.findMany({
    include: {
      contacts: { where: { isPrimary: true }, take: 1 },
      leads: {
        select: {
          id: true,
          status: true,
          score: true,
          category: true,
          qualificationLabel: true,
          solarSuitability: true,
          estimatedKw: true,
        },
      },
      _count: { select: { contacts: true, leads: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getContacts() {
  return prisma.contact.findMany({
    include: {
      company: { select: { id: true, name: true, city: true, postcode: true, website: true } },
      _count: { select: { leads: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  return prisma.lead.update({
    where: { id },
    data: { status },
  });
}

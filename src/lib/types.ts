import type {
  LeadCategory,
  LeadSource,
  LeadStatus,
  QualificationLabel,
  SolarSuitability,
} from "@prisma/client";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE: "Website",
  REFERRAL: "Referral",
  COLD_OUTREACH: "Cold Outreach",
  TRADE_SHOW: "Trade Show",
  PARTNER: "Partner",
  AI_DISCOVERY: "AI Discovery",
  FACEBOOK: "Facebook Ad",
};

export const LEAD_CATEGORY_LABELS: Record<LeadCategory, string> = {
  A: "A — Priority",
  B: "B — Strong",
  C: "C — Moderate",
  D: "D — Low Priority",
};

export const DATA_CONFIDENCE_LABELS = {
  VERIFIED: "verified",
  ESTIMATED: "estimated",
  UNKNOWN: "unknown",
} as const;

export const QUALIFICATION_LABELS: Record<QualificationLabel, string> = {
  EXCELLENT: "Excellent Prospect",
  GOOD_PROSPECT: "Good Prospect",
  MODERATE: "Moderate Prospect",
  POOR: "Poor Prospect",
  UNQUALIFIED: "Unqualified",
  NOT_ANALYSED: "Not Analysed",
};

export const SOLAR_SUITABILITY_LABELS: Record<SolarSuitability, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  UNKNOWN: "Unknown",
};

export const LEAD_STATUSES = Object.keys(LEAD_STATUS_LABELS) as LeadStatus[];
export const LEAD_CATEGORIES = Object.keys(LEAD_CATEGORY_LABELS) as LeadCategory[];
export const QUALIFICATION_LABELS_LIST = Object.keys(
  QUALIFICATION_LABELS
) as QualificationLabel[];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function displayValue(
  value: string | number | null | undefined,
  formatter?: (v: number) => string
): string {
  if (value == null || value === "") return "Unknown";
  if (typeof value === "number" && formatter) return formatter(value);
  return String(value);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 bg-emerald-50 ring-emerald-600/20";
  if (score >= 60) return "text-amber-600 bg-amber-50 ring-amber-600/20";
  if (score >= 40) return "text-orange-600 bg-orange-50 ring-orange-600/20";
  return "text-slate-600 bg-slate-50 ring-slate-600/20";
}

export function getCategoryColor(category: LeadCategory): string {
  const colors: Record<LeadCategory, string> = {
    A: "text-emerald-700 bg-emerald-50 ring-emerald-600/20",
    B: "text-blue-700 bg-blue-50 ring-blue-600/20",
    C: "text-amber-700 bg-amber-50 ring-amber-600/20",
    D: "text-slate-600 bg-slate-100 ring-slate-500/20",
  };
  return colors[category];
}

export function getQualificationColor(label: QualificationLabel): string {
  const colors: Record<QualificationLabel, string> = {
    EXCELLENT: "text-emerald-700 bg-emerald-50 ring-emerald-600/20",
    GOOD_PROSPECT: "text-blue-700 bg-blue-50 ring-blue-600/20",
    MODERATE: "text-amber-700 bg-amber-50 ring-amber-600/20",
    POOR: "text-orange-700 bg-orange-50 ring-orange-600/20",
    UNQUALIFIED: "text-red-700 bg-red-50 ring-red-600/20",
    NOT_ANALYSED: "text-slate-500 bg-slate-100 ring-slate-400/20",
  };
  return colors[label];
}

export function getSuitabilityColor(suitability: SolarSuitability): string {
  const colors: Record<SolarSuitability, string> = {
    HIGH: "text-emerald-700 bg-emerald-50 ring-emerald-600/20",
    MEDIUM: "text-amber-700 bg-amber-50 ring-amber-600/20",
    LOW: "text-orange-700 bg-orange-50 ring-orange-600/20",
    UNKNOWN: "text-slate-500 bg-slate-100 ring-slate-400/20",
  };
  return colors[suitability];
}

export function getStatusColor(status: LeadStatus): string {
  const colors: Record<LeadStatus, string> = {
    NEW: "text-blue-700 bg-blue-50 ring-blue-600/20",
    CONTACTED: "text-violet-700 bg-violet-50 ring-violet-600/20",
    QUALIFIED: "text-emerald-700 bg-emerald-50 ring-emerald-600/20",
    PROPOSAL: "text-amber-700 bg-amber-50 ring-amber-600/20",
    NEGOTIATION: "text-orange-700 bg-orange-50 ring-orange-600/20",
    WON: "text-green-700 bg-green-50 ring-green-600/20",
    LOST: "text-red-700 bg-red-50 ring-red-600/20",
  };
  return colors[status];
}

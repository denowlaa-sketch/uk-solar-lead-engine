import type {
  LeadCategory,
  QualificationLabel,
  SolarSuitability,
} from "@prisma/client";
import type { AnalysisReason, AnalysisResult, LeadFacts } from "./types";

const HIGH_LOAD_INDUSTRIES = [
  "manufacturing",
  "logistics",
  "food & beverage",
  "data centres",
  "cold storage",
  "printing",
  "marine engineering",
  "agriculture",
];

function scoreFromRange(
  value: number,
  thresholds: [number, number][]
): number {
  for (const [min, points] of thresholds) {
    if (value >= min) return points;
  }
  return 0;
}

function assessSolarSuitability(facts: LeadFacts): {
  suitability: SolarSuitability;
  reason: AnalysisReason | null;
  unknowns: string[];
} {
  const unknowns: string[] = [];
  const { company, lead } = facts;

  const hasRoof = company.roofSizeSqm != null && company.roofSizeSqm > 0;
  const hasKw = lead.estimatedKw != null && lead.estimatedKw > 0;

  if (!hasRoof && !hasKw) {
    unknowns.push("Roof size / usable area (m²)");
    unknowns.push("Estimated system size (kW)");
    return {
      suitability: "UNKNOWN",
      reason: {
        factor: "Solar Suitability",
        impact: 0,
        detail: "Cannot assess — roof size and estimated kW are both unknown.",
        known: false,
      },
      unknowns,
    };
  }

  const roofScore = hasRoof
    ? scoreFromRange(company.roofSizeSqm!, [
        [3000, 3],
        [1500, 2],
        [500, 1],
        [0, 0],
      ])
    : 0;

  const kwScore = hasKw
    ? scoreFromRange(lead.estimatedKw!, [
        [300, 3],
        [150, 2],
        [50, 1],
        [0, 0],
      ])
    : 0;

  if (!hasRoof) unknowns.push("Roof size / usable area (m²)");
  if (!hasKw) unknowns.push("Estimated system size (kW)");

  const combined = roofScore + kwScore;
  let suitability: SolarSuitability;
  let detail: string;

  if (combined >= 4) {
    suitability = "HIGH";
    detail = hasRoof && hasKw
      ? `Large roof (${company.roofSizeSqm!.toLocaleString()} m²) and substantial system potential (${lead.estimatedKw} kW).`
      : hasRoof
        ? `Large roof area (${company.roofSizeSqm!.toLocaleString()} m²) — system size not yet confirmed.`
        : `Substantial system potential (${lead.estimatedKw} kW) — roof area not yet confirmed.`;
  } else if (combined >= 2) {
    suitability = "MEDIUM";
    detail = "Moderate roof or system size based on available data.";
  } else {
    suitability = "LOW";
    detail = "Limited roof or system size based on available data.";
  }

  return {
    suitability,
    reason: {
      factor: "Solar Suitability",
      impact: combined * 5,
      detail,
      known: true,
    },
    unknowns,
  };
}

function scoreEnergyProfile(facts: LeadFacts): {
  reasons: AnalysisReason[];
  unknowns: string[];
  points: number;
} {
  const { company } = facts;
  const reasons: AnalysisReason[] = [];
  const unknowns: string[] = [];
  let points = 0;

  if (company.energyBillMonthly != null && company.energyBillMonthly > 0) {
    const billPoints = scoreFromRange(company.energyBillMonthly, [
      [10000, 25],
      [5000, 20],
      [3000, 15],
      [1500, 10],
      [0, 5],
    ]);
    points += billPoints;
    reasons.push({
      factor: "Monthly Energy Bill",
      impact: billPoints,
      detail: `£${company.energyBillMonthly.toLocaleString()}/mo — higher bills indicate stronger ROI potential.`,
      known: true,
    });
  } else {
    unknowns.push("Monthly energy bill (£)");
  }

  if (company.annualKwhUsage != null && company.annualKwhUsage > 0) {
    const kwhPoints = scoreFromRange(company.annualKwhUsage, [
      [1000000, 15],
      [500000, 12],
      [250000, 8],
      [100000, 5],
      [0, 2],
    ]);
    points += kwhPoints;
    const sourceLabel =
      company.annualKwhSource === "VERIFIED"
        ? "verified"
        : company.annualKwhSource === "ESTIMATED"
          ? "estimated"
          : "unverified";
    reasons.push({
      factor: "Annual Electricity Usage",
      impact: kwhPoints,
      detail: `${company.annualKwhUsage.toLocaleString()} kWh/yr (${sourceLabel}). Usage is scored only when a stored figure exists.`,
      known: company.annualKwhSource !== "UNKNOWN",
    });
  } else {
    unknowns.push("Annual electricity usage (kWh)");
  }

  if (points === 0) {
    reasons.push({
      factor: "Energy Profile",
      impact: 0,
      detail: "No energy consumption data available — cannot score energy fit.",
      known: false,
    });
  }

  return { reasons, unknowns, points };
}

function scoreIndustryFit(facts: LeadFacts): {
  reason: AnalysisReason;
  points: number;
} {
  const industry = facts.company.industry.toLowerCase();
  const isHighLoad = HIGH_LOAD_INDUSTRIES.some((i) => industry.includes(i));

  if (isHighLoad) {
    return {
      points: 15,
      reason: {
        factor: "Industry Fit",
        impact: 15,
        detail: `${facts.company.industry} — typically high daytime electricity demand, good solar match.`,
        known: true,
      },
    };
  }

  return {
    points: 8,
    reason: {
      factor: "Industry Fit",
      impact: 8,
      detail: `${facts.company.industry} — moderate solar fit; daytime load profile not verified.`,
      known: true,
    },
  };
}

function scoreContactReadiness(facts: LeadFacts): {
  reason: AnalysisReason;
  points: number;
  unknowns: string[];
} {
  const { contact } = facts;
  const unknowns: string[] = [];

  if (!contact) {
    unknowns.push("Primary contact");
    return {
      points: 0,
      reason: {
        factor: "Contact Readiness",
        impact: 0,
        detail: "No contact linked — outreach readiness unknown.",
        known: false,
      },
      unknowns,
    };
  }

  const hasEmail = Boolean(contact.email?.trim());
  const hasPhone = Boolean(contact.phone);
  const hasTitle = Boolean(contact.jobTitle);

  if (!hasEmail) unknowns.push("Contact email");
  if (!hasPhone) unknowns.push("Contact phone");
  if (!hasTitle) unknowns.push("Contact job title");

  let points = 0;
  if (hasEmail) points += 5;
  if (hasPhone) points += 5;
  if (hasTitle) points += 5;

  const missing = [!hasEmail && "email", !hasPhone && "phone", !hasTitle && "job title"]
    .filter(Boolean)
    .join(", ");

  return {
    points,
    reason: {
      factor: "Contact Readiness",
      impact: points,
      detail: missing
        ? `Contact ${contact.firstName} ${contact.lastName} — missing: ${missing}.`
        : `Full contact details for ${contact.firstName} ${contact.lastName} (${contact.jobTitle}).`,
      known: hasEmail || hasPhone,
    },
    unknowns,
  };
}

function scoreCompanyProfile(facts: LeadFacts): {
  reasons: AnalysisReason[];
  unknowns: string[];
  points: number;
} {
  const { company } = facts;
  const reasons: AnalysisReason[] = [];
  const unknowns: string[] = [];
  let points = 0;

  if (company.website) {
    points += 5;
    reasons.push({
      factor: "Website",
      impact: 5,
      detail: company.website,
      known: true,
    });
  } else {
    unknowns.push("Company website");
  }

  if (company.employeeCount != null) {
    const empPoints = scoreFromRange(company.employeeCount, [
      [100, 10],
      [50, 7],
      [20, 5],
      [0, 3],
    ]);
    points += empPoints;
    reasons.push({
      factor: "Company Size",
      impact: empPoints,
      detail: `${company.employeeCount} employees.`,
      known: true,
    });
  } else {
    unknowns.push("Employee count");
  }

  if (company.annualRevenue != null) {
    const revPoints = scoreFromRange(company.annualRevenue, [
      [5000000, 10],
      [2000000, 7],
      [1000000, 5],
      [0, 3],
    ]);
    points += revPoints;
    reasons.push({
      factor: "Annual Revenue",
      impact: revPoints,
      detail: `£${company.annualRevenue.toLocaleString()} turnover.`,
      known: true,
    });
  } else {
    unknowns.push("Annual revenue");
  }

  return { reasons, unknowns, points };
}

function scoreIrradiance(facts: LeadFacts): {
  reason: AnalysisReason;
  points: number;
  unknowns: string[];
} {
  const { company } = facts;
  const unknowns: string[] = [];

  if (company.irradianceKwhPerKwp == null) {
    unknowns.push("Regional solar irradiance (kWh/kWp)");
    return {
      points: 0,
      unknowns,
      reason: {
        factor: "Regional Irradiance",
        impact: 0,
        detail: "No postcode-based yield estimate available.",
        known: false,
      },
    };
  }

  const yieldKwh = company.irradianceKwhPerKwp;
  const points = scoreFromRange(yieldKwh, [
    [1050, 10],
    [980, 7],
    [900, 5],
    [0, 3],
  ]);
  const source =
    company.irradianceSource === "VERIFIED"
      ? "verified"
      : company.irradianceSource === "ESTIMATED"
        ? "estimated regional average"
        : "unverified";

  return {
    points,
    unknowns,
    reason: {
      factor: "Regional Irradiance",
      impact: points,
      detail: `${yieldKwh} kWh/kWp/yr in ${company.irradianceRegion ?? "this postcode area"} (${source}).`,
      known: true,
    },
  };
}

function assignCategory(score: number): LeadCategory {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

function assignQualification(score: number): QualificationLabel {
  if (score >= 85) return "EXCELLENT";
  if (score >= 70) return "GOOD_PROSPECT";
  if (score >= 50) return "MODERATE";
  if (score >= 30) return "POOR";
  return "UNQUALIFIED";
}

export function runScoringEngine(facts: LeadFacts): AnalysisResult {
  const allReasons: AnalysisReason[] = [];
  const allUnknowns = new Set<string>();
  let totalPoints = 0;
  const maxPoints = 100;

  const solar = assessSolarSuitability(facts);
  if (solar.reason) allReasons.push(solar.reason);
  solar.unknowns.forEach((u) => allUnknowns.add(u));
  if (solar.reason?.known) totalPoints += solar.reason.impact;

  const energy = scoreEnergyProfile(facts);
  allReasons.push(...energy.reasons);
  energy.unknowns.forEach((u) => allUnknowns.add(u));
  totalPoints += energy.points;

  const industry = scoreIndustryFit(facts);
  allReasons.push(industry.reason);
  totalPoints += industry.points;

  const contact = scoreContactReadiness(facts);
  allReasons.push(contact.reason);
  contact.unknowns.forEach((u) => allUnknowns.add(u));
  totalPoints += contact.points;

  const company = scoreCompanyProfile(facts);
  allReasons.push(...company.reasons);
  company.unknowns.forEach((u) => allUnknowns.add(u));
  totalPoints += company.points;

  const irradiance = scoreIrradiance(facts);
  allReasons.push(irradiance.reason);
  irradiance.unknowns.forEach((u) => allUnknowns.add(u));
  totalPoints += irradiance.points;

  const unknownCount = allUnknowns.size;
  if (unknownCount > 0) {
    const confidencePenalty = Math.min(20, unknownCount * 3);
    totalPoints = Math.max(0, totalPoints - confidencePenalty);
    allReasons.push({
      factor: "Data Confidence",
      impact: -confidencePenalty,
      detail: `${unknownCount} field${unknownCount > 1 ? "s" : ""} unknown — score adjusted down by ${confidencePenalty} pts. Unknowns listed separately.`,
      known: true,
    });
  }

  const score = Math.min(maxPoints, Math.max(0, Math.round(totalPoints)));
  const category = assignCategory(score);
  const qualificationLabel = assignQualification(score);

  return {
    score,
    category,
    qualificationLabel,
    solarSuitability: solar.suitability,
    reasons: allReasons,
    unknowns: Array.from(allUnknowns).sort(),
    pipelineVersion: "1.0",
  };
}

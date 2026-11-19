import type { FacebookFormAnswers } from "./types";
import { BILL_BAND_TO_MONTHLY } from "./types";
import type { AnalysisResult } from "../analysis/types";

/**
 * Residential Facebook-form qualifier. Does not guess missing answers.
 * Calls and emails are not sent here — slice 1 stores the result only.
 */
export function qualifyFacebookLead(answers: FacebookFormAnswers): AnalysisResult {
  const reasons: AnalysisResult["reasons"] = [];
  const unknowns: string[] = [];
  let points = 0;

  if (answers.consentToCall) {
    points += 10;
    reasons.push({
      factor: "Call consent",
      impact: 10,
      detail: "Lead ticked consent to be called about solar.",
      known: true,
    });
  } else {
    unknowns.push("Consent to call");
    reasons.push({
      factor: "Call consent",
      impact: 0,
      detail: "No call consent on the form — bot must not dial this lead.",
      known: false,
    });
  }

  if (answers.homeowner === true) {
    points += 30;
    reasons.push({
      factor: "Homeowner",
      impact: 30,
      detail: "Answered yes — can usually install.",
      known: true,
    });
  } else if (answers.homeowner === false) {
    reasons.push({
      factor: "Homeowner",
      impact: 0,
      detail: "Not a homeowner — typically unqualified for rooftop solar.",
      known: true,
    });
  } else {
    unknowns.push("Homeowner");
  }

  if (answers.phone) {
    points += 15;
    reasons.push({
      factor: "Phone",
      impact: 15,
      detail: answers.phone,
      known: true,
    });
  } else {
    unknowns.push("Phone");
  }

  if (answers.email) {
    points += 10;
    reasons.push({
      factor: "Email",
      impact: 10,
      detail: answers.email,
      known: true,
    });
  } else {
    unknowns.push("Email");
  }

  if (answers.postcode && answers.postcode !== "UNKNOWN") {
    points += 10;
    reasons.push({
      factor: "Postcode",
      impact: 10,
      detail: answers.postcode,
      known: true,
    });
  } else {
    unknowns.push("Postcode");
  }

  if (answers.billBand && BILL_BAND_TO_MONTHLY[answers.billBand]) {
    const billPoints =
      answers.billBand === "150_plus" ? 25 : answers.billBand === "100_150" ? 20 : answers.billBand === "50_100" ? 12 : 5;
    points += billPoints;
    reasons.push({
      factor: "Electricity bill band",
      impact: billPoints,
      detail: answers.billBand,
      known: true,
    });
  } else {
    unknowns.push("Electricity bill band");
  }

  if (answers.timeline) {
    const t =
      answers.timeline === "now" ? 15 : answers.timeline === "3_months" ? 12 : answers.timeline === "6_months" ? 6 : 3;
    points += t;
    reasons.push({
      factor: "Timeline",
      impact: t,
      detail: answers.timeline,
      known: true,
    });
  } else {
    unknowns.push("Install timeline");
  }

  if (answers.roofType) {
    points += 5;
    reasons.push({
      factor: "Roof type",
      impact: 5,
      detail: answers.roofType,
      known: true,
    });
  } else {
    unknowns.push("Roof type");
  }

  if (unknowns.length) {
    const penalty = Math.min(15, unknowns.length * 3);
    points = Math.max(0, points - penalty);
    reasons.push({
      factor: "Data confidence",
      impact: -penalty,
      detail: `${unknowns.length} form field(s) unanswered.`,
      known: true,
    });
  }

  const score = Math.min(100, Math.max(0, Math.round(points)));
  const disqualified = answers.homeowner === false;

  return {
    score: disqualified ? Math.min(score, 35) : score,
    category: disqualified ? "D" : score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D",
    qualificationLabel: disqualified
      ? "UNQUALIFIED"
      : score >= 85
        ? "EXCELLENT"
        : score >= 70
          ? "GOOD_PROSPECT"
          : score >= 50
            ? "MODERATE"
            : score >= 30
              ? "POOR"
              : "UNQUALIFIED",
    solarSuitability: answers.homeowner === false ? "LOW" : score >= 70 ? "HIGH" : score >= 45 ? "MEDIUM" : "UNKNOWN",
    reasons,
    unknowns,
    pipelineVersion: "residential-1.1",
  };
}

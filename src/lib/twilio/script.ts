import type { SandboxCallAnswers } from "../facebook/calls";

export type VoiceStep =
  | "interested"
  | "homeowner"
  | "bill"
  | "timeline"
  | "roof"
  | "followup";

export const VOICE_STEPS: VoiceStep[] = [
  "interested",
  "homeowner",
  "bill",
  "timeline",
  "roof",
  "followup",
];

export function nextStep(step: VoiceStep): VoiceStep | "done" {
  const i = VOICE_STEPS.indexOf(step);
  if (i < 0 || i >= VOICE_STEPS.length - 1) return "done";
  return VOICE_STEPS[i + 1];
}

export function promptFor(step: VoiceStep): string {
  switch (step) {
    case "interested":
      return "Hello, this is a follow-up about your solar enquiry. You agreed we could call. Press 1 if you are still interested, or 2 if you are not.";
    case "homeowner":
      return "Do you own the property? Press 1 for yes, or 2 for no.";
    case "bill":
      return "Roughly how much is your monthly electricity bill? Press 1 for under 50 pounds, 2 for 50 to 100, 3 for 100 to 150, or 4 for 150 or more.";
    case "timeline":
      return "When would you like to install? Press 1 if ready now, 2 within 3 months, 3 within 6 months, or 4 if you are only researching.";
    case "roof":
      return "Is the roof in decent condition and not heavily shaded? Press 1 for yes, or 2 for no.";
    case "followup":
      return "Can an advisor follow up with you? Press 1 for yes, or 2 for no.";
  }
}

export function applyDigit(answers: SandboxCallAnswers, step: VoiceStep, digits: string): SandboxCallAnswers | { error: string } {
  const d = digits.trim()[0];
  if (!d) return { error: "empty" };

  const next = { ...answers };
  if (step === "interested") {
    if (d === "1") next.stillInterested = true;
    else if (d === "2") next.stillInterested = false;
    else return { error: "invalid" };
  } else if (step === "homeowner") {
    if (d === "1") next.homeowner = true;
    else if (d === "2") next.homeowner = false;
    else return { error: "invalid" };
  } else if (step === "bill") {
    const map: Record<string, string> = {
      "1": "under_50",
      "2": "50_100",
      "3": "100_150",
      "4": "150_plus",
    };
    if (!map[d]) return { error: "invalid" };
    next.billBand = map[d];
  } else if (step === "timeline") {
    const map: Record<string, string> = {
      "1": "now",
      "2": "3_months",
      "3": "6_months",
      "4": "researching",
    };
    if (!map[d]) return { error: "invalid" };
    next.timeline = map[d];
  } else if (step === "roof") {
    if (d === "1") next.roofOk = true;
    else if (d === "2") next.roofOk = false;
    else return { error: "invalid" };
  } else if (step === "followup") {
    if (d === "1") next.followUpOk = true;
    else if (d === "2") next.followUpOk = false;
    else return { error: "invalid" };
  }
  return next;
}

export function parseStoredAnswers(raw: string | null | undefined): SandboxCallAnswers {
  if (!raw) {
    return {
      stillInterested: true,
      homeowner: true,
      roofOk: true,
      followUpOk: true,
    };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<SandboxCallAnswers>;
    return {
      stillInterested: parsed.stillInterested !== false,
      homeowner: parsed.homeowner !== false,
      billBand: parsed.billBand,
      timeline: parsed.timeline,
      roofOk: parsed.roofOk !== false,
      followUpOk: parsed.followUpOk !== false,
      notes: parsed.notes,
    };
  } catch {
    return {
      stillInterested: true,
      homeowner: true,
      roofOk: true,
      followUpOk: true,
    };
  }
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function twiml(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}

export function gatherTwiml(action: string, say: string, extra = ""): string {
  return twiml(
    `<Gather numDigits="1" timeout="8" action="${escapeXml(action)}" method="POST"><Say voice="Polly.Amy" language="en-GB">${escapeXml(say)}</Say></Gather>${extra}`
  );
}

export function sayHangup(message: string): string {
  return twiml(`<Say voice="Polly.Amy" language="en-GB">${escapeXml(message)}</Say><Hangup/>`);
}

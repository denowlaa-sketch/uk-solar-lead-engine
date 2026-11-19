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
      return "Hello, this is a follow-up about the solar form you submitted. You agreed we could call. Are you still interested in a quote?";
    case "homeowner":
      return "Do you own the property?";
    case "bill":
      return "Roughly how much do you pay for electricity each month? Just tell me a number in pounds.";
    case "timeline":
      return "When would you like solar installed? You can say now, in a few months, or that you are still looking around.";
    case "roof":
      return "Is the roof in decent condition, without a lot of shade?";
    case "followup":
      return "Can an advisor call you back with a quote?";
  }
}

function normaliseSpeech(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseYesNo(speech: string): boolean | undefined {
  const t = normaliseSpeech(speech);
  if (!t) return undefined;
  if (
    /\b(not interested|no thanks|no thank you|dont own|do not own|not the owner|i rent|we rent|tenant)\b/.test(t) ||
    /^(no|nah|nope|not really)\b/.test(t)
  ) {
    return false;
  }
  if (/\b(yes|yeah|yep|yup|sure|i am|i do|we do|we own|i own|homeowner|interested|please)\b/.test(t)) {
    return true;
  }
  if (/\bno\b/.test(t) && !/\byes\b/.test(t)) return false;
  return undefined;
}

function parseBill(speech: string): string | undefined {
  const t = normaliseSpeech(speech);
  const amount = t.match(/\b(\d{2,4})\b/);
  const n = amount ? Number(amount[1]) : NaN;
  if (/\b(under 50|less than 50|below 50|not much)\b/.test(t) || (Number.isFinite(n) && n < 50)) return "under_50";
  if (/\b(150|two hundred|200|over 150|more than 150)\b/.test(t) || (Number.isFinite(n) && n >= 150)) return "150_plus";
  if (/\b(100 to 150|100 and 150|hundred and fifty)\b/.test(t) || (Number.isFinite(n) && n >= 100 && n < 150)) {
    return "100_150";
  }
  if (/\b(50 to 100|50 and 100)\b/.test(t) || (Number.isFinite(n) && n >= 50 && n < 100)) return "50_100";
  if (/\b(a hundred|one hundred|about 100)\b/.test(t)) return "100_150";
  return undefined;
}

function parseTimeline(speech: string): string | undefined {
  const t = normaliseSpeech(speech);
  if (/\b(now|asap|as soon|ready|this month|straight away)\b/.test(t)) return "now";
  if (/\b(six months?|6 months?|later this year|next year)\b/.test(t)) return "6_months";
  if (/\b(three months?|3 months?|few months?|couple of months?|soon)\b/.test(t)) return "3_months";
  if (/\b(research|looking|just seeing|not sure|browsing)\b/.test(t)) return "researching";
  return undefined;
}

export function applySpeech(
  answers: SandboxCallAnswers,
  step: VoiceStep,
  speech: string
): SandboxCallAnswers | { error: string } {
  const next = { ...answers };
  if (step === "interested") {
    const v = parseYesNo(speech);
    if (v === undefined) return { error: "invalid" };
    next.stillInterested = v;
  } else if (step === "homeowner") {
    const t = normaliseSpeech(speech);
    if (/\b(rent|tenant|landlord|dont own|do not own)\b/.test(t)) next.homeowner = false;
    else {
      const v = parseYesNo(speech);
      if (v === undefined) return { error: "invalid" };
      next.homeowner = v;
    }
  } else if (step === "bill") {
    const band = parseBill(speech);
    if (!band) return { error: "invalid" };
    next.billBand = band;
  } else if (step === "timeline") {
    const timeline = parseTimeline(speech);
    if (!timeline) return { error: "invalid" };
    next.timeline = timeline;
  } else if (step === "roof") {
    const t = normaliseSpeech(speech);
    if (/\b(shade|shaded|leak|poor|bad|no)\b/.test(t) && !/\b(yes|fine|good|ok|okay|decent)\b/.test(t)) {
      next.roofOk = false;
    } else {
      const v = parseYesNo(speech);
      if (v === undefined) return { error: "invalid" };
      next.roofOk = v;
    }
  } else if (step === "followup") {
    const v = parseYesNo(speech);
    if (v === undefined) return { error: "invalid" };
    next.followUpOk = v;
  }
  return next;
}

export function applyReply(
  answers: SandboxCallAnswers,
  step: VoiceStep,
  digits: string,
  speech: string
): SandboxCallAnswers | { error: string } {
  if (digits.trim()) return applyDigit(answers, step, digits);
  if (speech.trim()) return applySpeech(answers, step, speech);
  return { error: "empty" };
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

const SAY_VOICE = "Polly.Amy-Neural";

function spoken(text: string): string {
  return `<Say voice="${SAY_VOICE}" language="en-GB">${escapeXml(text)}</Say>`;
}

export function gatherTwiml(action: string, say: string, extra = ""): string {
  return twiml(
    `<Gather input="speech dtmf" language="en-GB" speechTimeout="1" timeout="4" numDigits="1" hints="yes, no, yeah, pounds, months, now, researching, shaded, own, rent" action="${escapeXml(action)}" method="POST">${spoken(say)}</Gather>${extra}`
  );
}

export function sayHangup(message: string): string {
  return twiml(`${spoken(message)}<Hangup/>`);
}

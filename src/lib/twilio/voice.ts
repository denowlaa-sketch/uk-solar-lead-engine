import { prisma } from "../prisma";
import { completeSandboxCall, type SandboxCallAnswers } from "../facebook/calls";
import {
  applyDigit,
  gatherTwiml,
  nextStep,
  parseStoredAnswers,
  promptFor,
  sayHangup,
  type VoiceStep,
  VOICE_STEPS,
} from "./script";
import { twilioWebhookUrl } from "./signature";

function xmlResponse(xml: string) {
  return new Response(xml, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function handleVoiceStart(attemptId: string, step: VoiceStep) {
  const attempt = await prisma.callAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.status !== "IN_PROGRESS") {
    return xmlResponse(sayHangup("This call is no longer active. Goodbye."));
  }
  const action = twilioWebhookUrl(`/api/twilio/voice/${attemptId}/${step}`);
  if (!action) {
    return xmlResponse(sayHangup("The call system is not configured. Goodbye."));
  }
  const retry = `<Redirect method="POST">${action}</Redirect>`;
  return xmlResponse(gatherTwiml(action, promptFor(step), retry));
}

export async function handleVoiceDigit(attemptId: string, step: VoiceStep, digits: string) {
  const attempt = await prisma.callAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.status !== "IN_PROGRESS") {
    return xmlResponse(sayHangup("This call is no longer active. Goodbye."));
  }

  const current = parseStoredAnswers(attempt.answers);
  const applied = applyDigit(current, step, digits);
  if ("error" in applied) {
    return handleVoiceStart(attemptId, step);
  }

  await prisma.callAttempt.update({
    where: { id: attemptId },
    data: { answers: JSON.stringify(applied) },
  });

  const following = nextStep(step);
  if (following === "done") {
    const result = await completeSandboxCall(attempt.leadId, applied, undefined, {
      attemptId,
      live: true,
    });
    const message =
      "outcome" in result && result.outcome === "QUALIFIED"
        ? "Thank you. An advisor will follow up. Goodbye."
        : "Thank you. We will not continue this enquiry. Goodbye.";
    return xmlResponse(sayHangup(message));
  }

  return handleVoiceStart(attemptId, following);
}

export async function handleVoiceStatus(attemptId: string, callStatus: string) {
  const attempt = await prisma.callAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) return;

  await prisma.callAttempt.update({
    where: { id: attemptId },
    data: { providerStatus: callStatus, twilioCallSid: attempt.twilioCallSid },
  });

  if (attempt.status !== "IN_PROGRESS") return;

  const ended = ["completed", "busy", "failed", "no-answer", "canceled"];
  if (!ended.includes(callStatus.toLowerCase())) return;

  const answers: SandboxCallAnswers = parseStoredAnswers(attempt.answers);
  const answeredAll = VOICE_STEPS.every((step) => {
    if (step === "interested") return typeof answers.stillInterested === "boolean";
    if (step === "homeowner") return typeof answers.homeowner === "boolean";
    if (step === "bill") return Boolean(answers.billBand);
    if (step === "timeline") return Boolean(answers.timeline);
    if (step === "roof") return typeof answers.roofOk === "boolean";
    if (step === "followup") return typeof answers.followUpOk === "boolean";
    return true;
  });

  if (answeredAll) return;

  const override = ["busy", "no-answer", "failed"].includes(callStatus.toLowerCase())
    ? "NO_ANSWER"
    : "CALLBACK";

  await completeSandboxCall(attempt.leadId, answers, override, { attemptId, live: true });
}

export function isVoiceStep(value: string): value is VoiceStep {
  return (VOICE_STEPS as string[]).includes(value);
}

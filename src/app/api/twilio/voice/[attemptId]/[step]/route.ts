import { NextRequest, NextResponse } from "next/server";
import { handleVoiceDigit, handleVoiceStart, handleVoiceStatus, isVoiceStep } from "@/lib/twilio/voice";
import { isValidTwilioSignature, readTwilioForm, twilioWebhookUrl } from "@/lib/twilio/signature";
import { sayHangup } from "@/lib/twilio/script";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string; step: string }> }
) {
  const { attemptId, step } = await params;
  const paramsBody = await readTwilioForm(request);
  const url = twilioWebhookUrl(`/api/twilio/voice/${attemptId}/${step}`);
  const signature = request.headers.get("x-twilio-signature");
  if (!url || !isValidTwilioSignature(url, paramsBody, signature)) {
    return new NextResponse("Invalid Twilio signature", { status: 403 });
  }

  if (step === "status") {
    await handleVoiceStatus(attemptId, paramsBody.CallStatus ?? "");
    return new NextResponse("ok");
  }

  if (!isVoiceStep(step)) {
    return new NextResponse(sayHangup("Goodbye."), {
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  }

  const digits = paramsBody.Digits ?? "";
  if (!digits) {
    return handleVoiceStart(attemptId, step);
  }
  return handleVoiceDigit(attemptId, step, digits);
}

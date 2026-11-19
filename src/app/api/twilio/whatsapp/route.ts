import { NextRequest, NextResponse } from "next/server";
import { handleWhatsAppInbound } from "@/lib/twilio/whatsapp";
import { isValidTwilioSignature, readTwilioForm, twilioWebhookUrl } from "@/lib/twilio/signature";

export async function POST(request: NextRequest) {
  const params = await readTwilioForm(request);
  const url = twilioWebhookUrl("/api/twilio/whatsapp");
  const signature = request.headers.get("x-twilio-signature");
  if (!url || !isValidTwilioSignature(url, params, signature)) {
    return new NextResponse("Invalid Twilio signature", { status: 403 });
  }

  await handleWhatsAppInbound(params);
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { "Content-Type": "text/xml; charset=utf-8" } }
  );
}

import { NextRequest, NextResponse } from "next/server";
import { allowFacebookSimulate } from "@/lib/facebook/env";
import { ingestFacebookLead } from "@/lib/facebook/ingest";
import { extractUkPostcode, parseYesNo } from "@/lib/facebook/parse";

export async function POST(request: NextRequest) {
  if (!allowFacebookSimulate()) {
    return NextResponse.json({ error: "Simulate is disabled in production" }, { status: 403 });
  }

  const body = await request.json();
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const phone = String(body.phone ?? "").trim() || undefined;
  const streetAddress = String(body.address ?? body.streetAddress ?? "").trim() || undefined;
  const postcode = (
    String(body.postcode ?? "").trim() ||
    extractUkPostcode(streetAddress) ||
    ""
  ).toUpperCase();

  if (!firstName || !lastName || !phone) {
    return NextResponse.json({ error: "firstName, lastName, and phone are required" }, { status: 400 });
  }

  const result = await ingestFacebookLead({
    firstName,
    lastName,
    email: String(body.email ?? "").trim() || undefined,
    phone,
    streetAddress,
    postcode: postcode || "UNKNOWN",
    city: String(body.city ?? "").trim() || undefined,
    consentToCall: parseYesNo(String(body.consentToCall ?? "yes")) === true,
    facebookLeadId: `sim_${Date.now()}`,
    raw: body,
  });

  return NextResponse.json(result);
}

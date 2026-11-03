import { NextRequest, NextResponse } from "next/server";
import { allowFacebookSimulate } from "@/lib/facebook/env";
import { ingestFacebookLead } from "@/lib/facebook/ingest";
import { parseBillBand, parseTimeline, parseYesNo } from "@/lib/facebook/parse";

export async function POST(request: NextRequest) {
  if (!allowFacebookSimulate()) {
    return NextResponse.json({ error: "Simulate is disabled in production" }, { status: 403 });
  }

  const body = await request.json();
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const postcode = String(body.postcode ?? "").trim().toUpperCase();
  const phone = String(body.phone ?? "").trim() || undefined;

  if (!firstName || !lastName || !postcode || !phone) {
    return NextResponse.json(
      { error: "firstName, lastName, postcode, and phone are required" },
      { status: 400 }
    );
  }

  const result = await ingestFacebookLead({
    firstName,
    lastName,
    email: String(body.email ?? "").trim() || undefined,
    phone,
    postcode,
    city: String(body.city ?? "").trim() || undefined,
    homeowner: parseYesNo(String(body.homeowner ?? "yes")),
    billBand: parseBillBand(String(body.billBand ?? "")),
    roofType: String(body.roofType ?? "").trim() || undefined,
    timeline: parseTimeline(String(body.timeline ?? "")),
    consentToCall: parseYesNo(String(body.consentToCall ?? "yes")) === true,
    facebookLeadId: `sim_${Date.now()}`,
    raw: body,
  });

  return NextResponse.json(result);
}

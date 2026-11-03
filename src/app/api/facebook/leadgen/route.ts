import { NextRequest, NextResponse } from "next/server";
import {
  getFacebookAppSecret,
  getFacebookPageAccessToken,
  getFacebookVerifyToken,
} from "@/lib/facebook/env";
import { extractLeadgenChanges, fetchFacebookLead, verifyFacebookSignature } from "@/lib/facebook/graph";
import { ingestFacebookLead } from "@/lib/facebook/ingest";

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  const expected = getFacebookVerifyToken();

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (getFacebookAppSecret() && !verifyFacebookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const changes = extractLeadgenChanges(payload);
  if (!changes.length) {
    return NextResponse.json({ received: true, ingested: 0 });
  }

  if (!getFacebookPageAccessToken()) {
    return NextResponse.json(
      {
        error:
          "FACEBOOK_PAGE_ACCESS_TOKEN missing. Meta webhook arrived but answers cannot be fetched yet.",
      },
      { status: 400 }
    );
  }

  const results = [];
  for (const change of changes) {
    try {
      const answers = await fetchFacebookLead(change.leadgen_id!);
      answers.facebookFormId = answers.facebookFormId ?? change.form_id;
      answers.facebookPageId = answers.facebookPageId ?? change.page_id;
      const ingested = await ingestFacebookLead(answers);
      results.push(ingested);
    } catch (error) {
      results.push({
        error: error instanceof Error ? error.message : "Ingest failed",
        leadgenId: change.leadgen_id,
      });
    }
  }

  return NextResponse.json({ received: true, results });
}

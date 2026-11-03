import { NextResponse } from "next/server";
import { getLeadForCall } from "@/lib/facebook/calls";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lead = await getLeadForCall(id);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  const latest = lead.callAttempts[0] ?? null;
  return NextResponse.json({
    leadId: lead.id,
    status: lead.status,
    latestAttempt: latest
      ? {
          id: latest.id,
          mode: latest.mode,
          status: latest.status,
          outcome: latest.outcome,
          summary: latest.summary,
          providerStatus: latest.providerStatus,
          twilioCallSid: latest.twilioCallSid,
        }
      : null,
  });
}

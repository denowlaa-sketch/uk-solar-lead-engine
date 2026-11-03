import { NextRequest, NextResponse } from "next/server";
import { completeSandboxCall, type SandboxCallAnswers } from "@/lib/facebook/calls";
import { parseBillBand, parseTimeline, parseYesNo } from "@/lib/facebook/parse";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const outcomeOverride =
    body.outcome === "NO_ANSWER" || body.outcome === "CALLBACK" ? body.outcome : undefined;

  const answers: SandboxCallAnswers = {
    stillInterested: parseYesNo(String(body.stillInterested ?? "yes")) === true,
    homeowner: parseYesNo(String(body.homeowner ?? "yes")) === true,
    billBand: parseBillBand(String(body.billBand ?? "")) ?? undefined,
    timeline: parseTimeline(String(body.timeline ?? "")) ?? undefined,
    roofOk: parseYesNo(String(body.roofOk ?? "yes")) === true,
    followUpOk: parseYesNo(String(body.followUpOk ?? "yes")) === true,
    notes: String(body.notes ?? "").trim() || undefined,
  };

  const result = await completeSandboxCall(id, answers, outcomeOverride);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}

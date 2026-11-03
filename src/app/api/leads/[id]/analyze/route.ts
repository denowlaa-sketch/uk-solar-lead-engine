import { NextResponse } from "next/server";
import { runLeadAnalysis } from "@/lib/analysis/pipeline";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await runLeadAnalysis(id);

  if (!result) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

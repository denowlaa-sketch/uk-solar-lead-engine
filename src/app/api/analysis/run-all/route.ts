import { NextResponse } from "next/server";
import { runBulkAnalysis } from "@/lib/analysis/pipeline";

export async function POST() {
  const result = await runBulkAnalysis();
  return NextResponse.json(result);
}

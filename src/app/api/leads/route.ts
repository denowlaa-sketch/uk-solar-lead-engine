import { NextRequest, NextResponse } from "next/server";
import type { LeadCategory, LeadStatus, QualificationLabel } from "@prisma/client";
import { getLeads } from "@/lib/leads";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const minScoreParam = searchParams.get("minScore");

  const leads = await getLeads({
    status: (searchParams.get("status") as LeadStatus | null) ?? undefined,
    category: (searchParams.get("category") as LeadCategory | null) ?? undefined,
    qualification: (searchParams.get("qualification") as QualificationLabel | null) ?? undefined,
    search: searchParams.get("search") ?? undefined,
    minScore: minScoreParam ? parseInt(minScoreParam, 10) : undefined,
  });

  return NextResponse.json(leads);
}

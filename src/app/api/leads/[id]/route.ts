import { NextRequest, NextResponse } from "next/server";
import type { LeadStatus } from "@prisma/client";
import { updateLeadStatus } from "@/lib/leads";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (!body.status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  const lead = await updateLeadStatus(id, body.status as LeadStatus);
  return NextResponse.json(lead);
}

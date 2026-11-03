import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyOwnerOfQualifiedLead } from "@/lib/email/notify";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (lead.status !== "QUALIFIED") {
    return NextResponse.json({ error: "Lead is not QUALIFIED" }, { status: 400 });
  }

  const result = await notifyOwnerOfQualifiedLead(id);
  return NextResponse.json(result);
}

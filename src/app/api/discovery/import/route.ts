import { NextRequest, NextResponse } from "next/server";
import { importProspect } from "@/lib/discovery/service";

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const result = await importProspect(body.id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}

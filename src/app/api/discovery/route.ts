import { NextResponse } from "next/server";
import { listDiscoveryProspects } from "@/lib/discovery/service";

export async function GET() {
  const prospects = await listDiscoveryProspects();
  return NextResponse.json(prospects);
}

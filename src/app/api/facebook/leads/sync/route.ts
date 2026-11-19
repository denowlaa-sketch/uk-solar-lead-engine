import { NextResponse } from "next/server";
import { pullFacebookLeadsFromMeta } from "@/lib/facebook/pull";

export async function POST() {
  const result = await pullFacebookLeadsFromMeta();
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import { twilioStatus } from "@/lib/twilio/env";

export async function GET() {
  return NextResponse.json(twilioStatus());
}

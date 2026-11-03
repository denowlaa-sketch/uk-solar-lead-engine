import { NextResponse } from "next/server";
import { ownerEmailStatus } from "@/lib/email/notify";

export async function GET() {
  return NextResponse.json(ownerEmailStatus());
}

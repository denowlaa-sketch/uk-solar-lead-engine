import { NextResponse } from "next/server";
import { getWatchdogStatus, startFacebookWatchdog } from "@/lib/facebook/watchdog";

export const dynamic = "force-dynamic";

export async function GET() {
  startFacebookWatchdog();
  return NextResponse.json({
    ok: true,
    service: "uk-solar-lead-engine",
    now: new Date().toISOString(),
    facebook: getWatchdogStatus(),
  });
}

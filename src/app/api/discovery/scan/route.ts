import { NextRequest, NextResponse } from "next/server";
import { CompaniesHouseError, isCompaniesHouseConfigured } from "@/lib/discovery/companies-house";
import { runCompaniesHouseScan } from "@/lib/discovery/scan";
import { activePlacesProvider, isGooglePlacesConfigured } from "@/lib/enrichment/places";

export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({
    configured: isCompaniesHouseConfigured(),
    placesProvider: activePlacesProvider(),
    googlePlaces: isGooglePlacesConfigured(),
  });
}

export async function POST(request: NextRequest) {
  if (!isCompaniesHouseConfigured()) {
    return NextResponse.json(
      {
        error:
          "COMPANIES_HOUSE_API_KEY is not set. Create a free key at https://developer.company-information.service.gov.uk/ and add it to .env",
      },
      { status: 400 }
    );
  }

  let body: { location?: string; segment?: string; size?: number } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const result = await runCompaniesHouseScan({
      location: body.location,
      segment: body.segment,
      size: body.size,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof CompaniesHouseError ? error.message : "Scan failed";
    const status = error instanceof CompaniesHouseError && error.status === 429 ? 429 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

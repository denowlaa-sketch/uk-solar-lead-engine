import { prisma } from "../prisma";
import {
  CompaniesHouseError,
  advancedCompanySearch,
  companiesHousePublicUrl,
  formatAddressLine,
  listActiveDirectors,
  parseOfficerName,
  sleep,
  type ChSearchItem,
} from "./companies-house";
import { activePlacesProvider, lookupPlaces, placesNote } from "@/lib/enrichment/places";
import {
  DEFAULT_SCAN_LOCATION,
  DEFAULT_SCAN_SIZE,
  MAX_SCAN_SIZE,
  MIN_SCAN_SIZE,
  getSegment,
  industryFromSicCodes,
  sicCodesForScan,
} from "./icp";

export type ScanOptions = {
  location?: string;
  segment?: string;
  size?: number;
};

export type ScanResult = {
  location: string;
  segment: string;
  sicCodes: string[];
  created: number;
  skippedDuplicate: number;
  skippedInvalid: number;
  officerLookups: number;
  placesMatched: number;
  placesProvider: string;
  errors: string[];
};

function clampSize(size: number | undefined): number {
  if (size == null || Number.isNaN(size)) return DEFAULT_SCAN_SIZE;
  return Math.min(MAX_SCAN_SIZE, Math.max(MIN_SCAN_SIZE, Math.round(size)));
}

function isInvalidCandidate(item: ChSearchItem): string | null {
  const number = item.company_number?.trim();
  const name = item.company_name?.trim();
  const postcode = item.registered_office_address?.postal_code?.trim();

  if (!number) return "missing company number";
  if (!name) return "missing company name";
  if (item.company_status && item.company_status !== "active") return "not active";
  if (!postcode) return "missing postcode";
  if (/\bdormant\b/i.test(name)) return "dormant company";
  return null;
}

async function firstDirectorContact(companyNumber: string) {
  const officers = await listActiveDirectors(companyNumber);
  const director =
    officers.find((o) => o.officer_role === "director") ??
    officers.find((o) => o.officer_role && o.officer_role.includes("director")) ??
    officers[0];

  const parsed = parseOfficerName(director?.name);
  if (!parsed) return null;

  return {
    contactFirstName: parsed.firstName,
    contactLastName: parsed.lastName,
    contactJobTitle: director?.officer_role ? toRoleLabel(director.officer_role) : "Director",
  };
}

function toRoleLabel(role: string): string {
  return role
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function runCompaniesHouseScan(options: ScanOptions = {}): Promise<ScanResult> {
  const location = (options.location ?? DEFAULT_SCAN_LOCATION).trim() || DEFAULT_SCAN_LOCATION;
  const size = clampSize(options.size);
  const segment = getSegment(options.segment);
  const sicCodes = sicCodesForScan(options.segment);

  const result: ScanResult = {
    location,
    segment: segment?.id ?? "all",
    sicCodes,
    created: 0,
    skippedDuplicate: 0,
    skippedInvalid: 0,
    officerLookups: 0,
    placesMatched: 0,
    placesProvider: activePlacesProvider(),
    errors: [],
  };

  let items: ChSearchItem[];
  try {
    items = await advancedCompanySearch({ location, sicCodes, size });
  } catch (error) {
    if (error instanceof CompaniesHouseError) throw error;
    throw new CompaniesHouseError("Could not reach Companies House.");
  }

  for (const item of items) {
    const invalid = isInvalidCandidate(item);
    if (invalid) {
      result.skippedInvalid++;
      continue;
    }

    const companyNumber = item.company_number!.trim().toUpperCase();
    const [existingProspect, existingCompany] = await Promise.all([
      prisma.discoveryProspect.findUnique({ where: { companyNumber } }),
      prisma.company.findUnique({ where: { companyNumber } }),
    ]);

    if (existingProspect || existingCompany) {
      result.skippedDuplicate++;
      continue;
    }

    const address = item.registered_office_address;
    const sic = item.sic_codes ?? [];
    const industry = segment?.industry ?? industryFromSicCodes(sic);

    let contact: Awaited<ReturnType<typeof firstDirectorContact>> = null;
    try {
      contact = await firstDirectorContact(companyNumber);
      result.officerLookups++;
      await sleep(150);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Officer lookup failed";
      result.errors.push(`${companyNumber}: ${message}`);
    }

    const postcode = address!.postal_code!.trim().toUpperCase();
    const name = item.company_name!.trim();
    const city = address?.locality?.trim() || location;

    let website: string | undefined;
    let contactPhone: string | undefined;
    let placesSummary = "Places lookup skipped.";
    try {
      const places = await lookupPlaces({ name, postcode, city });
      result.placesProvider = places.provider;
      if (places.matched) result.placesMatched++;
      website = places.website;
      contactPhone = places.phone;
      placesSummary = placesNote(places);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Places lookup failed";
      result.errors.push(`${companyNumber}: ${message}`);
      placesSummary = "Places lookup failed; website and phone left unknown.";
    }

    const sicLabel = sic.length ? sic.join(", ") : "unknown";
    const notes = [
      `Found via Companies House advanced search (${location}).`,
      `Company number ${companyNumber}.`,
      `SIC ${sicLabel}.`,
      placesSummary,
      "Roof size, energy bill, and email stay unknown unless a later licensed source provides them.",
      "No emails or calls were sent.",
    ].join(" ");

    try {
      await prisma.discoveryProspect.create({
        data: {
          name,
          companyNumber,
          address: formatAddressLine(address),
          postcode,
          city,
          county: address?.region?.trim() || null,
          industry,
          sicCodes: sic.length ? sic.join(",") : null,
          website,
          contactFirstName: contact?.contactFirstName,
          contactLastName: contact?.contactLastName,
          contactJobTitle: contact?.contactJobTitle,
          contactPhone,
          notes,
          sourceName: "Companies House",
          sourceUrl: companiesHousePublicUrl(companyNumber),
          externalId: companyNumber,
          fetchedAt: new Date(),
        },
      });
      result.created++;
    } catch {
      result.skippedDuplicate++;
    }
  }

  return result;
}

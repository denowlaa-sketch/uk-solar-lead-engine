import { readFileSync } from "fs";
import { resolve } from "path";

const CH_BASE = "https://api.company-information.service.gov.uk";
const FIND_AND_UPDATE_BASE = "https://find-and-update.company-information.service.gov.uk";

export class CompaniesHouseError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "CompaniesHouseError";
  }
}

export type ChAddress = {
  address_line_1?: string;
  address_line_2?: string;
  locality?: string;
  region?: string;
  postal_code?: string;
  country?: string;
};

export type ChSearchItem = {
  company_name?: string;
  company_number?: string;
  company_status?: string;
  date_of_creation?: string;
  sic_codes?: string[];
  registered_office_address?: ChAddress;
};

type ChSearchResponse = {
  items?: ChSearchItem[];
  hits?: string | number;
};

type ChOfficer = {
  name?: string;
  officer_role?: string;
  resigned_on?: string;
};

type ChOfficersResponse = {
  items?: ChOfficer[];
};

function readKeyFromEnvFile(): string | undefined {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    const match = text.match(/^COMPANIES_HOUSE_API_KEY\s*=\s*(.*)$/m);
    if (!match) return undefined;
    return match[1].trim().replace(/^["']|["']$/g, "") || undefined;
  } catch {
    return undefined;
  }
}

export function getCompaniesHouseApiKey(): string | undefined {
  const fromProcess = (process.env["COMPANIES_HOUSE_API_KEY"] ?? "").trim();
  if (fromProcess) return fromProcess;
  return readKeyFromEnvFile();
}

function getApiKey(): string {
  const key = getCompaniesHouseApiKey();
  if (!key) {
    throw new CompaniesHouseError(
      "COMPANIES_HOUSE_API_KEY is not set. Add a free key from https://developer.company-information.service.gov.uk/"
    );
  }
  return key;
}

export function isCompaniesHouseConfigured(): boolean {
  return Boolean(getCompaniesHouseApiKey());
}

export function companiesHousePublicUrl(companyNumber: string): string {
  return `${FIND_AND_UPDATE_BASE}/company/${companyNumber}`;
}

async function chFetch<T>(path: string, searchParams?: Record<string, string>): Promise<T> {
  const url = new URL(path, CH_BASE);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${getApiKey()}:`).toString("base64")}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    throw new CompaniesHouseError("Companies House rejected the API key.", response.status);
  }
  if (response.status === 429) {
    throw new CompaniesHouseError("Companies House rate limit hit. Try again in a few minutes.", 429);
  }
  if (!response.ok) {
    throw new CompaniesHouseError(`Companies House request failed (${response.status}).`, response.status);
  }

  return (await response.json()) as T;
}

export async function advancedCompanySearch(options: {
  location: string;
  sicCodes: string[];
  size: number;
}): Promise<ChSearchItem[]> {
  const params: Record<string, string> = {
    company_status: "active",
    company_type: "ltd,plc",
    location: options.location,
    size: String(options.size),
    start_index: "0",
  };
  if (options.sicCodes.length) {
    params.sic_codes = options.sicCodes.join(",");
  }

  const data = await chFetch<ChSearchResponse>("/advanced-search/companies", params);
  return data.items ?? [];
}

export async function listActiveDirectors(companyNumber: string): Promise<ChOfficer[]> {
  const data = await chFetch<ChOfficersResponse>(`/company/${companyNumber}/officers`, {
    items_per_page: "10",
  });
  return (data.items ?? []).filter((officer) => !officer.resigned_on);
}

export function parseOfficerName(name: string | undefined): {
  firstName: string;
  lastName: string;
} | null {
  if (!name?.trim()) return null;
  const cleaned = name.replace(/\s+/g, " ").trim();
  const comma = cleaned.indexOf(",");
  if (comma > 0) {
    const lastName = toTitleCase(cleaned.slice(0, comma).trim());
    const firstName = toTitleCase(
      cleaned
        .slice(comma + 1)
        .replace(/\b(mr|mrs|ms|miss|dr|sir|lord|lady|prof)\b\.?/gi, "")
        .trim()
    );
    if (!firstName || !lastName) return null;
    return { firstName, lastName };
  }

  const parts = cleaned.split(" ");
  if (parts.length < 2) return null;
  return {
    firstName: toTitleCase(parts.slice(0, -1).join(" ")),
    lastName: toTitleCase(parts.at(-1)!),
  };
}

export function formatAddressLine(address: ChAddress | undefined): string | null {
  if (!address) return null;
  const parts = [address.address_line_1, address.address_line_2].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

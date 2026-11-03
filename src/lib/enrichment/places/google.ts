import { readFileSync } from "fs";
import { resolve } from "path";
import {
  normalizePhone,
  normalizeWebsite,
  stripCompanySuffix,
  textIncludesPostcode,
} from "./normalize";
import type { PlacesMatch, PlacesQuery } from "./types";

const ATTRIBUTION = "Google Places";

function readGoogleKeyFromEnvFile(): string | undefined {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    const match = text.match(/^GOOGLE_PLACES_API_KEY\s*=\s*(.*)$/m);
    if (!match) return undefined;
    return match[1].trim().replace(/^["']|["']$/g, "") || undefined;
  } catch {
    return undefined;
  }
}

export function getGooglePlacesApiKey(): string | undefined {
  const fromProcess = (process.env["GOOGLE_PLACES_API_KEY"] ?? "").trim();
  if (fromProcess) return fromProcess;
  return readGoogleKeyFromEnvFile();
}

export function isGooglePlacesConfigured(): boolean {
  return Boolean(getGooglePlacesApiKey());
}

type FindPlaceResponse = {
  status?: string;
  error_message?: string;
  candidates?: Array<{ place_id?: string; formatted_address?: string; name?: string }>;
};

type PlaceDetailsResponse = {
  status?: string;
  error_message?: string;
  result?: {
    website?: string;
    formatted_phone_number?: string;
    international_phone_number?: string;
    formatted_address?: string;
    name?: string;
    url?: string;
  };
};

export async function lookupGooglePlaces(query: PlacesQuery): Promise<PlacesMatch> {
  const key = getGooglePlacesApiKey();
  const empty: PlacesMatch = { matched: false, provider: "google", attribution: ATTRIBUTION };
  if (!key) return empty;

  const input = [stripCompanySuffix(query.name), query.city, query.postcode].filter(Boolean).join(" ");
  const findUrl = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
  findUrl.searchParams.set("input", input);
  findUrl.searchParams.set("inputtype", "textquery");
  findUrl.searchParams.set("fields", "place_id,formatted_address,name");
  findUrl.searchParams.set("key", key);

  const findRes = await fetch(findUrl, { cache: "no-store" });
  const found = (await findRes.json()) as FindPlaceResponse;
  if (found.status && found.status !== "OK" && found.status !== "ZERO_RESULTS") {
    throw new Error(found.error_message || `Google Places search failed (${found.status}).`);
  }

  const candidate = found.candidates?.[0];
  if (!candidate?.place_id) return empty;
  if (!textIncludesPostcode(candidate.formatted_address, query.postcode)) return empty;

  const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  detailsUrl.searchParams.set("place_id", candidate.place_id);
  detailsUrl.searchParams.set("fields", "website,formatted_phone_number,international_phone_number,formatted_address,name,url");
  detailsUrl.searchParams.set("key", key);

  const detailsRes = await fetch(detailsUrl, { cache: "no-store" });
  const details = (await detailsRes.json()) as PlaceDetailsResponse;
  if (details.status && details.status !== "OK") {
    throw new Error(details.error_message || `Google Places details failed (${details.status}).`);
  }

  const website = normalizeWebsite(details.result?.website);
  const phone = normalizePhone(
    details.result?.international_phone_number ?? details.result?.formatted_phone_number
  );

  return {
    matched: Boolean(website || phone),
    provider: "google",
    website,
    phone,
    displayName: details.result?.name ?? candidate.name,
    attribution: ATTRIBUTION,
  };
}

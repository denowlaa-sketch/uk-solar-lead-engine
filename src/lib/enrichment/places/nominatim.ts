import { sleep } from "@/lib/discovery/companies-house";
import {
  normalizePhone,
  normalizeWebsite,
  postcodeMatches,
  stripCompanySuffix,
  textIncludesPostcode,
} from "./normalize";
import type { PlacesMatch, PlacesQuery } from "./types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "UK-Solar-Lead-Engine/0.1 (local solar lead research; OSM Nominatim)";
const ATTRIBUTION = "Place data © OpenStreetMap contributors (ODbL)";

type NominatimResult = {
  display_name?: string;
  address?: { postcode?: string; city?: string; town?: string };
  extratags?: Record<string, string>;
};

export async function lookupNominatim(query: PlacesQuery): Promise<PlacesMatch> {
  const empty: PlacesMatch = {
    matched: false,
    provider: "nominatim",
    attribution: ATTRIBUTION,
  };

  const q = [stripCompanySuffix(query.name), query.city, query.postcode].filter(Boolean).join(" ");
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "gb");
  url.searchParams.set("q", q);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    cache: "no-store",
  });

  if (response.status === 429) {
    throw new Error("OpenStreetMap Nominatim rate limit hit. Wait a minute and try again.");
  }
  if (!response.ok) {
    throw new Error(`Nominatim request failed (${response.status}).`);
  }

  const results = (await response.json()) as NominatimResult[];
  const hit = (results ?? []).find((item) => {
    const resultPostcode = item.address?.postcode;
    return (
      postcodeMatches(resultPostcode, query.postcode) ||
      textIncludesPostcode(item.display_name, query.postcode)
    );
  });

  if (!hit) return empty;

  const tags = hit.extratags ?? {};
  const website = normalizeWebsite(tags.website ?? tags["contact:website"] ?? tags.url);
  const phone = normalizePhone(tags.phone ?? tags["contact:phone"] ?? tags["contact:mobile"]);

  return {
    matched: Boolean(website || phone),
    provider: "nominatim",
    website,
    phone,
    displayName: hit.display_name,
    attribution: ATTRIBUTION,
  };
}

export async function lookupNominatimThrottled(query: PlacesQuery): Promise<PlacesMatch> {
  const result = await lookupNominatim(query);
  await sleep(1100);
  return result;
}

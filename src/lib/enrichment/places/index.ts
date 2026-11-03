import { isGooglePlacesConfigured, lookupGooglePlaces } from "./google";
import { lookupNominatimThrottled } from "./nominatim";
import type { PlacesMatch, PlacesProvider, PlacesQuery } from "./types";

export type { PlacesMatch, PlacesProvider, PlacesQuery } from "./types";
export { isGooglePlacesConfigured } from "./google";

const cache = new Map<string, PlacesMatch>();

function cacheKey(query: PlacesQuery): string {
  return `${query.name.trim().toLowerCase()}|${query.postcode.replace(/\s+/g, "").toUpperCase()}`;
}

export function activePlacesProvider(): PlacesProvider {
  return isGooglePlacesConfigured() ? "google" : "nominatim";
}

/**
 * Website/phone lookup. Google Places if GOOGLE_PLACES_API_KEY is set,
 * otherwise OpenStreetMap Nominatim (free, 1 req/s, ODbL).
 * Never invents values; unmatched postcodes return empty fields.
 */
export async function lookupPlaces(query: PlacesQuery): Promise<PlacesMatch> {
  const key = cacheKey(query);
  const cached = cache.get(key);
  if (cached) return cached;

  const match = isGooglePlacesConfigured()
    ? await lookupGooglePlaces(query)
    : await lookupNominatimThrottled(query);

  cache.set(key, match);
  return match;
}

export function placesNote(match: PlacesMatch): string {
  if (!match.matched) {
    return `Places lookup (${match.provider}) found no postcode-matched website or phone.`;
  }
  const bits = [
    match.website ? `website ${match.website}` : null,
    match.phone ? `phone ${match.phone}` : null,
  ].filter(Boolean);
  return `Places lookup (${match.provider}) filled ${bits.join(" and ")}. ${match.attribution}.`;
}

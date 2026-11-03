export type PlacesProvider = "google" | "nominatim";

export type PlacesQuery = {
  name: string;
  postcode: string;
  city?: string | null;
};

export type PlacesMatch = {
  matched: boolean;
  provider: PlacesProvider;
  website?: string;
  phone?: string;
  displayName?: string;
  attribution: string;
};

import { Radar } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DiscoveryList } from "@/components/DiscoveryList";
import { DiscoveryScanForm } from "@/components/DiscoveryScanForm";
import { isCompaniesHouseConfigured } from "@/lib/discovery/companies-house";
import { listDiscoveryProspects } from "@/lib/discovery/service";
import { activePlacesProvider } from "@/lib/enrichment/places";

export const dynamic = "force-dynamic";

export default async function DiscoveryPage() {
  const prospects = await listDiscoveryProspects();
  const pending = prospects.filter((p) => !p.importedAt).length;

  return (
    <>
      <PageHeader
        title="AI Discovery"
        description="Scan Companies House, then look up website/phone via Places (OpenStreetMap Nominatim by default, Google Places if a key is set). Unmatched fields stay unknown. No emails or calls."
      >
        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          <Radar className="h-4 w-4 text-brand-600" />
          {pending} waiting to import
        </div>
      </PageHeader>
      <DiscoveryScanForm configured={isCompaniesHouseConfigured()} />
      <DiscoveryList prospects={prospects} />
      <p className="mt-6 text-xs text-slate-400">
        Places provider: {activePlacesProvider() === "google" ? "Google Places" : "OpenStreetMap Nominatim"}.
        OSM data © OpenStreetMap contributors, ODbL. Website and phone are filled only when the listing
        postcode matches.
      </p>
    </>
  );
}

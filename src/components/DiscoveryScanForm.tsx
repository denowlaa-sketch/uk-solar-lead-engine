"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Radar } from "lucide-react";
import {
  DEFAULT_SCAN_LOCATION,
  DEFAULT_SCAN_SIZE,
  ICP_SEGMENTS,
  MAX_SCAN_SIZE,
  MIN_SCAN_SIZE,
} from "@/lib/discovery/icp";
type ScanResult = {
  location: string;
  created: number;
  skippedDuplicate: number;
  skippedInvalid: number;
  placesMatched?: number;
  placesProvider?: string;
  errors: string[];
};

type DiscoveryScanFormProps = {
  configured: boolean;
};

export function DiscoveryScanForm({ configured: configuredProp }: DiscoveryScanFormProps) {
  const router = useRouter();
  const [configured, setConfigured] = useState(configuredProp);
  const [location, setLocation] = useState(DEFAULT_SCAN_LOCATION);
  const [segment, setSegment] = useState("logistics");
  const [size, setSize] = useState(DEFAULT_SCAN_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/discovery/scan")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && typeof data.configured === "boolean") {
          setConfigured(data.configured);
        }
      })
      .catch(() => {
        /* keep server-provided value */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/discovery/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, segment: segment === "all" ? undefined : segment, size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      setResult(data as ScanResult);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Companies House scan</h2>
          <p className="mt-1 text-sm text-slate-500">
            Companies House plus a Places lookup for website and phone. No scraping, emails, or
            calls. Import is still manual. OSM Nominatim is used unless GOOGLE_PLACES_API_KEY is set.
          </p>
        </div>
        <span
          className={`mt-2 inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
            configured
              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
              : "bg-amber-50 text-amber-800 ring-amber-600/20"
          }`}
        >
          {configured ? "API key configured" : "API key missing"}
        </span>
      </div>

      {!configured && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Add <code className="font-mono text-xs">COMPANIES_HOUSE_API_KEY</code> to{" "}
          <code className="font-mono text-xs">.env</code>. Free keys:{" "}
          <a
            href="https://developer.company-information.service.gov.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            Companies House Developer Hub
          </a>
          . Restart <code className="font-mono text-xs">npm run dev</code> after saving.
        </p>
      )}

      <form onSubmit={handleScan} className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="flex-1 text-sm">
          <span className="mb-1 block font-medium text-slate-700">Location</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Manchester"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </label>
        <label className="flex-1 text-sm">
          <span className="mb-1 block font-medium text-slate-700">ICP segment</span>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {ICP_SEGMENTS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
            <option value="all">All solar ICP SIC codes</option>
          </select>
        </label>
        <label className="w-full text-sm lg:w-28">
          <span className="mb-1 block font-medium text-slate-700">Max results</span>
          <input
            type="number"
            min={MIN_SCAN_SIZE}
            max={MAX_SCAN_SIZE}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </label>
        <button
          type="submit"
          disabled={loading || !configured}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
          {loading ? "Scanning…" : "Run scan"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {result && (
        <p className="mt-4 text-sm text-slate-600">
          Added <span className="font-medium text-slate-900">{result.created}</span> prospects
          in {result.location}. Places ({result.placesProvider ?? "nominatim"}) matched website/phone on{" "}
          {result.placesMatched ?? 0}. Skipped {result.skippedDuplicate} duplicates and{" "}
          {result.skippedInvalid} invalid rows
          {result.errors.length ? ` · ${result.errors.length} lookup warning(s)` : ""}.
        </p>
      )}
    </div>
  );
}

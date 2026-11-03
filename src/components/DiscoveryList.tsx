"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, Radar } from "lucide-react";
import type { DiscoveryProspect } from "@prisma/client";
import type { AnalysisResult } from "@/lib/analysis/types";
import { Badge } from "./Badge";
import {
  formatCurrency,
  formatDate,
  getCategoryColor,
  getQualificationColor,
  getScoreColor,
  QUALIFICATION_LABELS,
} from "@/lib/types";

type ProspectRow = DiscoveryProspect & {
  preview: AnalysisResult | null;
};

export function DiscoveryList({ prospects }: { prospects: ProspectRow[] }) {
  const router = useRouter();
  const [importingId, setImportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport(id: string) {
    setImportingId(id);
    setError(null);
    try {
      const res = await fetch("/api/discovery/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImportingId(null);
    }
  }

  const pending = prospects.filter((p) => !p.importedAt);
  const imported = prospects.filter((p) => p.importedAt);

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Scan results
          <span className="ml-2 text-sm font-normal text-slate-500">
            {pending.length} not yet in the pipeline
          </span>
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Website / Phone</th>
                <th className="px-4 py-3">Roof / Bill</th>
                <th className="px-4 py-3">Preview score</th>
                <th className="px-4 py-3">Unknowns</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    No prospects waiting. Run a Companies House scan above.
                  </td>
                </tr>
              ) : (
                pending.map((prospect) => (
                  <tr key={prospect.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{prospect.name}</div>
                      <div className="text-xs text-slate-500">
                        {prospect.city}, {prospect.postcode}
                        {prospect.companyNumber ? ` · ${prospect.companyNumber}` : ""}
                      </div>
                      {prospect.notes && (
                        <div className="mt-1 max-w-xs text-xs text-slate-400">{prospect.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{prospect.industry}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {prospect.sourceUrl ? (
                        <a
                          href={prospect.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:text-brand-700"
                        >
                          {prospect.sourceName ?? "Source"}
                        </a>
                      ) : (
                        prospect.sourceName ?? "Sample"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="max-w-[12rem] truncate">
                        {prospect.website ? (
                          <a
                            href={prospect.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-600 hover:text-brand-700"
                          >
                            {prospect.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <span className="text-slate-400">Website unknown</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {prospect.contactPhone ?? "Phone unknown"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>
                        {prospect.roofSizeSqm
                          ? `${prospect.roofSizeSqm.toLocaleString()} m²`
                          : "Roof unknown"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {prospect.energyBillMonthly
                          ? `${formatCurrency(prospect.energyBillMonthly)}/mo`
                          : "Bill unknown"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {prospect.preview ? (
                        <div className="flex flex-wrap gap-1">
                          <Badge className={getScoreColor(prospect.preview.score)}>
                            {prospect.preview.score}
                          </Badge>
                          <Badge className={getCategoryColor(prospect.preview.category)}>
                            {prospect.preview.category}
                          </Badge>
                          <Badge className={getQualificationColor(prospect.preview.qualificationLabel)}>
                            {QUALIFICATION_LABELS[prospect.preview.qualificationLabel]}
                          </Badge>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-amber-800">
                      {prospect.preview && prospect.preview.unknowns.length > 0
                        ? prospect.preview.unknowns.slice(0, 3).join("; ")
                        : "None listed"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleImport(prospect.id)}
                        disabled={importingId === prospect.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                      >
                        {importingId === prospect.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Radar className="h-3.5 w-3.5" />
                        )}
                        Import lead
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {imported.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Already imported</h2>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {imported.map((prospect) => (
              <li key={prospect.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{prospect.name}</p>
                  <p className="text-xs text-slate-500">
                    {prospect.city} · imported {prospect.importedAt ? formatDate(prospect.importedAt) : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                    <Check className="h-3.5 w-3.5" /> In pipeline
                  </span>
                  {prospect.importedLeadId && (
                    <Link
                      href={`/leads/${prospect.importedLeadId}`}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      Open lead
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

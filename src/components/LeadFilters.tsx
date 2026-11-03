"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  LEAD_CATEGORIES,
  LEAD_CATEGORY_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  QUALIFICATION_LABELS,
  QUALIFICATION_LABELS_LIST,
} from "@/lib/types";

type LeadFiltersProps = {
  initialStatus?: string;
  initialCategory?: string;
  initialQualification?: string;
  initialSearch?: string;
  initialMinScore?: string;
  basePath?: string;
};

export function LeadFilters({
  initialStatus = "",
  initialCategory = "",
  initialQualification = "",
  initialSearch = "",
  initialMinScore = "",
  basePath,
}: LeadFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const targetPath = basePath ?? pathname;

  function applyFilters(form: HTMLFormElement) {
    const data = new FormData(form);
    const params = new URLSearchParams();

    for (const [key, value] of data.entries()) {
      if (typeof value === "string" && value.trim()) {
        params.set(key, value.trim());
      }
    }

    const query = params.toString();
    router.push(query ? `${targetPath}?${query}` : targetPath);
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        applyFilters(e.currentTarget);
      }}
    >
      <div className="flex-1 min-w-[200px]">
        <label className="mb-1 block text-xs font-medium text-slate-500">Search</label>
        <input
          name="search"
          type="search"
          placeholder="Company, contact, city, email..."
          defaultValue={initialSearch}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div className="min-w-[140px]">
        <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
        <select
          name="status"
          defaultValue={initialStatus}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {LEAD_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[140px]">
        <label className="mb-1 block text-xs font-medium text-slate-500">Category</label>
        <select
          name="category"
          defaultValue={initialCategory}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="">All categories</option>
          {LEAD_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {LEAD_CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[160px]">
        <label className="mb-1 block text-xs font-medium text-slate-500">Qualification</label>
        <select
          name="qualification"
          defaultValue={initialQualification}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="">All qualifications</option>
          {QUALIFICATION_LABELS_LIST.map((q) => (
            <option key={q} value={q}>
              {QUALIFICATION_LABELS[q]}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[120px]">
        <label className="mb-1 block text-xs font-medium text-slate-500">Min. Score</label>
        <select
          name="minScore"
          defaultValue={initialMinScore}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="">Any score</option>
          <option value="80">80+</option>
          <option value="60">60+</option>
          <option value="40">40+</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => router.push(targetPath)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Clear
        </button>
      </div>
    </form>
  );
}

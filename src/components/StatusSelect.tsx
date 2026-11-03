"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LeadStatus } from "@prisma/client";
import { LEAD_STATUS_LABELS, LEAD_STATUSES } from "@/lib/types";

export function StatusSelect({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(next: LeadStatus) {
    const previous = value;
    setValue(next);
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        throw new Error("Could not update status");
      }
      router.refresh();
    } catch (err) {
      setValue(previous);
      setError(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">Pipeline status</label>
      <select
        value={value}
        disabled={saving}
        onChange={(e) => onChange(e.target.value as LeadStatus)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
      >
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {LEAD_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

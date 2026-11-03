"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";

export function NotifyOwnerButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function notify() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/notify-owner`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Notify failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Notify failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void notify()}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
        Email me this lead
      </button>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

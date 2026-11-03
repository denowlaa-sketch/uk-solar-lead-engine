"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import clsx from "clsx";

type RunAnalysisButtonProps = {
  leadId?: string;
  variant?: "primary" | "secondary";
  label?: string;
  onComplete?: () => void;
};

export function RunAnalysisButton({
  leadId,
  variant = "primary",
  label,
  onComplete,
}: RunAnalysisButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const url = leadId ? `/api/leads/${leadId}/analyze` : "/api/analysis/run-all";
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Analysis failed");
      }

      router.refresh();
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={clsx(
          "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60",
          variant === "primary"
            ? "bg-brand-600 text-white hover:bg-brand-700"
            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {label ?? (leadId ? "Run Analysis" : "Analyse All Leads")}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

import type { LeadStatus } from "@prisma/client";
import { LEAD_STATUS_LABELS } from "@/lib/types";

type StatusChartProps = {
  data: { status: LeadStatus; count: number }[];
  total: number;
};

const barColors: Record<LeadStatus, string> = {
  NEW: "bg-blue-500",
  CONTACTED: "bg-violet-500",
  QUALIFIED: "bg-emerald-500",
  PROPOSAL: "bg-amber-500",
  NEGOTIATION: "bg-orange-500",
  WON: "bg-green-600",
  LOST: "bg-red-400",
};

export function StatusChart({ data, total }: StatusChartProps) {
  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Pipeline by Status</h3>
      <div className="mt-4 space-y-3">
        {sorted.map(({ status, count }) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={status}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">{LEAD_STATUS_LABELS[status]}</span>
                <span className="text-slate-500">
                  {count} ({pct}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${barColors[status]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import type { LeadCategory } from "@prisma/client";
import { LEAD_CATEGORY_LABELS } from "@/lib/types";

type CategoryChartProps = {
  data: { category: LeadCategory; count: number }[];
  total: number;
};

const barColors: Record<LeadCategory, string> = {
  A: "bg-emerald-500",
  B: "bg-blue-500",
  C: "bg-amber-500",
  D: "bg-slate-400",
};

const order: LeadCategory[] = ["A", "B", "C", "D"];

export function CategoryChart({ data, total }: CategoryChartProps) {
  const map = new Map(data.map((d) => [d.category, d.count]));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Lead Categories (A–D)</h3>
      <div className="mt-4 space-y-3">
        {order.map((category) => {
          const count = map.get(category) ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={category}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">{LEAD_CATEGORY_LABELS[category]}</span>
                <span className="text-slate-500">
                  {count} ({pct}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${barColors[category]}`}
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

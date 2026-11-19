import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  accent?: "emerald" | "blue" | "amber" | "violet";
};

const accentStyles = {
  emerald: "bg-emerald-50 text-emerald-600",
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
};

export function StatCard({ label, value, icon: Icon, trend, accent = "emerald" }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/40 bg-[#f7f4ec]/95 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          {trend && <p className="mt-1 text-xs text-slate-500">{trend}</p>}
        </div>
        <div className={clsx("rounded-lg p-2.5", accentStyles[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

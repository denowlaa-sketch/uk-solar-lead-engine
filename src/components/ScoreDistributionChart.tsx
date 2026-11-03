type ScoreBucket = {
  label: string;
  count: number;
};

type ScoreDistributionChartProps = {
  buckets: ScoreBucket[];
};

const barColors = ["bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-slate-400"];

export function ScoreDistributionChart({ buckets }: ScoreDistributionChartProps) {
  const max = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Score Distribution</h3>
      <div className="mt-4 flex items-end gap-3 h-32">
        {buckets.map((bucket, i) => {
          const height = max > 0 ? (bucket.count / max) * 100 : 0;
          return (
            <div key={bucket.label} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-medium text-slate-700">{bucket.count}</span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className={`w-full rounded-t-md transition-all ${barColors[i]}`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500">{bucket.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

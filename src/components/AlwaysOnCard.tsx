type Props = {
  running: boolean;
  lastPullAt: string | null;
  lastImported: number | null;
  lastError: string | null;
};

function formatWhen(iso: string | null) {
  if (!iso) return "Waiting for first pull";
  const then = new Date(iso).getTime();
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 minute ago";
  return `${mins} minutes ago`;
}

export function AlwaysOnCard({ running, lastPullAt, lastImported, lastError }: Props) {
  return (
    <div className="rounded-2xl border border-white/40 bg-[#f7f4ec]/95 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">Always-on Meta pull</p>
      <p className={`mt-1 text-sm font-semibold ${running ? "text-emerald-700" : "text-rose-700"}`}>
        {running ? "On" : "Off"}
      </p>
      <p className="mt-1 text-xs text-slate-500">{formatWhen(lastPullAt)}</p>
      {lastImported != null && !lastError ? (
        <p className="mt-1 text-xs text-slate-500">Last import: {lastImported} new</p>
      ) : null}
      {lastError ? <p className="mt-1 text-xs text-rose-700">{lastError}</p> : null}
    </div>
  );
}

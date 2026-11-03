import { HelpCircle } from "lucide-react";

type UnknownBadgeProps = {
  label?: string;
};

export function UnknownBadge({ label = "Unknown" }: UnknownBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 text-slate-400">
      <HelpCircle className="h-3.5 w-3.5" />
      <span className="text-sm italic">{label}</span>
    </span>
  );
}

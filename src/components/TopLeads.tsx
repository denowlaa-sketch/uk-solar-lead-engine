import Link from "next/link";
import type { Company, Contact, Lead } from "@prisma/client";
import { ArrowRight } from "lucide-react";
import { Badge } from "./Badge";
import {
  getCategoryColor,
  getScoreColor,
  LEAD_CATEGORY_LABELS,
  LEAD_STATUS_LABELS,
  QUALIFICATION_LABELS,
} from "@/lib/types";

type LeadWithRelations = Lead & {
  company: Company;
  contact: Contact | null;
};

type TopLeadsProps = {
  leads: LeadWithRelations[];
};

export function TopLeads({ leads }: TopLeadsProps) {
  const scored = leads.filter((l) => l.qualificationLabel !== "NOT_ANALYSED");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Top Scoring Leads</h3>
        <Link
          href="/leads"
          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <ul className="mt-4 divide-y divide-slate-100">
        {scored.slice(0, 5).map((lead) => (
          <li key={lead.id}>
            <Link
              href={`/leads/${lead.id}`}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-slate-50 -mx-2 px-2 rounded-lg"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{lead.company.name}</p>
                <p className="text-xs text-slate-500">
                  {lead.company.city} · {LEAD_STATUS_LABELS[lead.status]}
                  {lead.category && ` · ${LEAD_CATEGORY_LABELS[lead.category]}`}
                </p>
                <p className="text-xs text-slate-400">
                  {QUALIFICATION_LABELS[lead.qualificationLabel]}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {lead.category && (
                  <Badge className={getCategoryColor(lead.category)}>{lead.category}</Badge>
                )}
                <Badge className={getScoreColor(lead.score)}>{lead.score}</Badge>
              </div>
            </Link>
          </li>
        ))}
        {scored.length === 0 && (
          <li className="py-6 text-center text-sm text-slate-500">
            No analysed leads yet. Run analysis to score leads.
          </li>
        )}
      </ul>
    </div>
  );
}

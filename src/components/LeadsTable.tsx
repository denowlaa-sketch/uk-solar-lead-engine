"use client";

import Link from "next/link";
import type { Company, Contact, Lead, LeadAnalysis } from "@prisma/client";
import { ExternalLink, Mail, Phone } from "lucide-react";
import { Badge } from "./Badge";
import { UnknownBadge } from "./UnknownBadge";
import {
  DATA_CONFIDENCE_LABELS,
  formatCurrency,
  formatNumber,
  getCategoryColor,
  getQualificationColor,
  getScoreColor,
  getStatusColor,
  getSuitabilityColor,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  QUALIFICATION_LABELS,
  SOLAR_SUITABILITY_LABELS,
} from "@/lib/types";

type LeadWithRelations = Lead & {
  company: Company;
  contact: Contact | null;
  analyses?: LeadAnalysis[];
};

type LeadsTableProps = {
  leads: LeadWithRelations[];
  compact?: boolean;
};

export function LeadsTable({ leads, compact = false }: LeadsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Contact</th>
              {!compact && <th className="px-4 py-3">Website</th>}
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Qualification</th>
              {!compact && <th className="px-4 py-3">Solar Fit</th>}
              {!compact && <th className="px-4 py-3">Energy Bill</th>}
              {!compact && <th className="px-4 py-3">Est. Usage</th>}
              {!compact && <th className="px-4 py-3">Est. kW</th>}
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={compact ? 8 : 13} className="px-4 py-12 text-center text-slate-500">
                  No leads found.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} className="group">
                      <div className="font-medium text-slate-900 group-hover:text-brand-600">
                        {lead.source === "FACEBOOK" && lead.contact
                          ? `${lead.contact.firstName} ${lead.contact.lastName}`
                          : lead.company.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {lead.company.city}, {lead.company.postcode}
                      </div>
                      <div className="text-xs text-slate-400">
                        {lead.source === "FACEBOOK"
                          ? lead.consentToCall
                            ? "Facebook · consent to call"
                            : "Facebook · no call consent"
                          : lead.company.industry}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {lead.contact ? (
                      <div className="space-y-0.5">
                        <div className="text-slate-900">
                          {lead.contact.firstName} {lead.contact.lastName}
                        </div>
                        {lead.contact.jobTitle ? (
                          <div className="text-xs text-slate-500">{lead.contact.jobTitle}</div>
                        ) : (
                          <UnknownBadge label="No job title" />
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {lead.contact.email ? (
                            <span className="flex items-center gap-0.5">
                              <Mail className="h-3 w-3" />
                              {lead.contact.email}
                            </span>
                          ) : (
                            <UnknownBadge label="No email" />
                          )}
                        </div>
                        {lead.contact.phone && (
                          <div className="flex items-center gap-0.5 text-xs text-slate-500">
                            <Phone className="h-3 w-3" />
                            {lead.contact.phone}
                          </div>
                        )}
                      </div>
                    ) : (
                      <UnknownBadge label="No contact" />
                    )}
                  </td>
                  {!compact && (
                    <td className="px-4 py-3">
                      {lead.company.website ? (
                        <a
                          href={lead.company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span className="max-w-[120px] truncate text-xs">
                            {lead.company.website.replace(/^https?:\/\//, "")}
                          </span>
                        </a>
                      ) : (
                        <UnknownBadge />
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Badge className={getStatusColor(lead.status)}>
                      {LEAD_STATUS_LABELS[lead.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {lead.qualificationLabel !== "NOT_ANALYSED" ? (
                      <Badge className={getScoreColor(lead.score)}>{lead.score}</Badge>
                    ) : (
                      <UnknownBadge label="Not scored" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lead.category ? (
                      <Badge className={getCategoryColor(lead.category)}>
                        {lead.category}
                      </Badge>
                    ) : (
                      <UnknownBadge label="—" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={getQualificationColor(lead.qualificationLabel)}>
                      {QUALIFICATION_LABELS[lead.qualificationLabel]}
                    </Badge>
                  </td>
                  {!compact && (
                    <td className="px-4 py-3">
                      <Badge className={getSuitabilityColor(lead.solarSuitability)}>
                        {SOLAR_SUITABILITY_LABELS[lead.solarSuitability]}
                      </Badge>
                    </td>
                  )}
                  {!compact && (
                    <td className="px-4 py-3 text-slate-600">
                      {lead.company.energyBillMonthly ? (
                        `${formatCurrency(lead.company.energyBillMonthly)}/mo`
                      ) : (
                        <UnknownBadge />
                      )}
                    </td>
                  )}
                  {!compact && (
                    <td className="px-4 py-3 text-slate-600">
                      {lead.company.annualKwhUsage ? (
                        <span>
                          {formatNumber(lead.company.annualKwhUsage)} kWh
                          <span className="block text-xs text-slate-400">
                            {DATA_CONFIDENCE_LABELS[lead.company.annualKwhSource]}
                          </span>
                        </span>
                      ) : (
                        <UnknownBadge />
                      )}
                    </td>
                  )}
                  {!compact && (
                    <td className="px-4 py-3 text-slate-600">
                      {lead.estimatedKw ? `${lead.estimatedKw} kW` : <UnknownBadge />}
                    </td>
                  )}
                  <td className="px-4 py-3 text-slate-600">
                    {LEAD_SOURCE_LABELS[lead.source]}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

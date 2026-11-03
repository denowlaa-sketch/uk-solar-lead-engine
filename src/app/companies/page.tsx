import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { UnknownBadge } from "@/components/UnknownBadge";
import { getCompanies } from "@/lib/leads";
import {
  formatCurrency,
  getCategoryColor,
  getScoreColor,
  LEAD_STATUS_LABELS,
} from "@/lib/types";

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <>
      <PageHeader
        title="Companies"
        description={`${companies.length} UK commercial prospects`}
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Energy Bill</th>
                <th className="px-4 py-3">Roof / kW</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map((company) => {
                const primaryContact = company.contacts[0];
                const lead = company.leads[0];

                return (
                  <tr key={company.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      {lead ? (
                        <Link href={`/leads/${lead.id}`} className="group">
                          <div className="font-medium text-slate-900 group-hover:text-brand-600">
                            {company.name}
                          </div>
                        </Link>
                      ) : (
                        <div className="font-medium text-slate-900">{company.name}</div>
                      )}
                      {company.website ? (
                        <div className="text-xs text-slate-500">{company.website}</div>
                      ) : (
                        <UnknownBadge label="No website" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{company.industry}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {company.city}, {company.postcode}
                    </td>
                    <td className="px-4 py-3">
                      {company.energyBillMonthly ? (
                        <span className="text-slate-600">
                          {formatCurrency(company.energyBillMonthly)}/mo
                        </span>
                      ) : (
                        <UnknownBadge />
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {company.roofSizeSqm ? (
                        `${company.roofSizeSqm.toLocaleString()} m²`
                      ) : (
                        <UnknownBadge label="Roof unknown" />
                      )}
                      {lead?.estimatedKw ? (
                        <span className="block text-xs text-slate-400">{lead.estimatedKw} kW</span>
                      ) : (
                        <span className="block">
                          <UnknownBadge label="kW unknown" />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {primaryContact ? (
                        <>
                          <div className="text-slate-900">
                            {primaryContact.firstName} {primaryContact.lastName}
                          </div>
                          <div className="text-xs text-slate-500">{primaryContact.email}</div>
                        </>
                      ) : (
                        <UnknownBadge label="No contact" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {lead ? (
                        <span className="text-slate-700">{LEAD_STATUS_LABELS[lead.status]}</span>
                      ) : (
                        <UnknownBadge />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {lead && lead.qualificationLabel !== "NOT_ANALYSED" ? (
                        <Badge className={getScoreColor(lead.score)}>{lead.score}</Badge>
                      ) : (
                        <UnknownBadge label="Not scored" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {lead?.category ? (
                        <Badge className={getCategoryColor(lead.category)}>{lead.category}</Badge>
                      ) : (
                        <UnknownBadge label="—" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

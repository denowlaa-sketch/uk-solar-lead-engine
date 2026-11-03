import type { Company, Contact, Lead, LeadAnalysis } from "@prisma/client";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Mail, Phone, Zap } from "lucide-react";
import { Badge } from "./Badge";
import { NotifyOwnerButton } from "./NotifyOwnerButton";
import { RunAnalysisButton } from "./RunAnalysisButton";
import { StatusSelect } from "./StatusSelect";
import { UnknownBadge } from "./UnknownBadge";
import { parseAnalysisReasons, parseAnalysisUnknowns } from "@/lib/analysis/pipeline";
import { BILL_BAND_LABELS, TIMELINE_LABELS } from "@/lib/facebook/types";
import {
  DATA_CONFIDENCE_LABELS,
  formatCurrency,
  formatDateTime,
  formatNumber,
  getCategoryColor,
  getQualificationColor,
  getScoreColor,
  getStatusColor,
  getSuitabilityColor,
  LEAD_CATEGORY_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  QUALIFICATION_LABELS,
  SOLAR_SUITABILITY_LABELS,
} from "@/lib/types";

type LeadDetail = Lead & {
  company: Company & { contacts: Contact[] };
  contact: Contact | null;
  analyses: LeadAnalysis[];
};

function InfoRow({
  label,
  value,
  unknown = false,
}: {
  label: string;
  value?: React.ReactNode;
  unknown?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className="text-sm text-slate-900 text-right">
        {unknown || value == null || value === "" ? <UnknownBadge /> : value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

export function LeadDetailView({ lead }: { lead: LeadDetail }) {
  const latestAnalysis = lead.analyses[0];
  const reasons = latestAnalysis ? parseAnalysisReasons(latestAnalysis.reasons) : [];
  const unknowns = latestAnalysis ? parseAnalysisUnknowns(latestAnalysis.unknowns) : [];

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to leads
        </Link>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{lead.company.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {lead.company.city}, {lead.company.postcode} · {lead.company.industry}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className={getStatusColor(lead.status)}>
              Status: {LEAD_STATUS_LABELS[lead.status]}
            </Badge>
            {lead.category && (
              <Badge className={getCategoryColor(lead.category)}>
                {LEAD_CATEGORY_LABELS[lead.category]}
              </Badge>
            )}
            <Badge className={getQualificationColor(lead.qualificationLabel)}>
              {QUALIFICATION_LABELS[lead.qualificationLabel]}
            </Badge>
            <Badge className={getSuitabilityColor(lead.solarSuitability)}>
              Solar: {SOLAR_SUITABILITY_LABELS[lead.solarSuitability]}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <StatusSelect leadId={lead.id} status={lead.status} />
          <RunAnalysisButton leadId={lead.id} />
          {lead.status === "QUALIFIED" && <NotifyOwnerButton leadId={lead.id} />}
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">AI Score</p>
          {lead.qualificationLabel !== "NOT_ANALYSED" ? (
            <p className="mt-1 text-3xl font-semibold text-slate-900">{lead.score}</p>
          ) : (
            <p className="mt-1 text-lg italic text-slate-400">Not analysed</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Est. System Size</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">
            {lead.estimatedKw ? `${lead.estimatedKw} kW` : "Unknown"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Monthly Energy Bill</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">
            {lead.company.energyBillMonthly
              ? formatCurrency(lead.company.energyBillMonthly)
              : "Unknown"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Last Analysed</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {lead.lastAnalysedAt ? formatDateTime(lead.lastAnalysedAt) : "Never"}
          </p>
        </div>
      </div>

      {lead.source === "FACEBOOK" && (
        <div className="mb-6">
          <Section title="Facebook Instant Form">
            <InfoRow
              label="Call consent"
              value={lead.consentToCall ? "Yes — may call later" : "No — do not call"}
            />
            <InfoRow
              label="Homeowner"
              unknown={lead.homeowner == null}
              value={lead.homeowner == null ? undefined : lead.homeowner ? "Yes" : "No"}
            />
            <InfoRow
              label="Bill band"
              unknown={!lead.billBand}
              value={lead.billBand ? BILL_BAND_LABELS[lead.billBand] ?? lead.billBand : undefined}
            />
            <InfoRow label="Roof type" unknown={!lead.roofType} value={lead.roofType} />
            <InfoRow
              label="Timeline"
              unknown={!lead.timeline}
              value={lead.timeline ? TIMELINE_LABELS[lead.timeline] ?? lead.timeline : undefined}
            />
            <InfoRow label="Facebook lead id" unknown={!lead.facebookLeadId} value={lead.facebookLeadId} />
            <p className="mt-3 text-xs text-slate-500">
              Call bot and owner notification email are not connected yet.
            </p>
          </Section>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Company Profile">
          <InfoRow label="Website" unknown={!lead.company.website} value={
            lead.company.website ? (
              <a href={lead.company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700">
                {lead.company.website.replace(/^https?:\/\//, "")}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : undefined
          } />
          <InfoRow
            label="Company Number"
            unknown={!lead.company.companyNumber}
            value={
              lead.company.companyNumber ? (
                <a
                  href={`https://find-and-update.company-information.service.gov.uk/company/${lead.company.companyNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700"
                >
                  {lead.company.companyNumber}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : undefined
            }
          />
          <InfoRow label="Address" unknown={!lead.company.address} value={lead.company.address} />
          <InfoRow label="Location" value={`${lead.company.city}, ${lead.company.postcode}`} />
          <InfoRow label="County" unknown={!lead.company.county} value={lead.company.county} />
          <InfoRow label="Industry" value={lead.company.industry} />
          <InfoRow
            label="Employees"
            unknown={lead.company.employeeCount == null}
            value={lead.company.employeeCount?.toLocaleString()}
          />
          <InfoRow
            label="Annual Revenue"
            unknown={lead.company.annualRevenue == null}
            value={lead.company.annualRevenue ? formatCurrency(lead.company.annualRevenue) : undefined}
          />
          <InfoRow
            label="Roof Size"
            unknown={lead.company.roofSizeSqm == null}
            value={lead.company.roofSizeSqm ? `${formatNumber(lead.company.roofSizeSqm)} m²` : undefined}
          />
        </Section>

        <Section title="Energy & Solar">
          <InfoRow
            label="Monthly Energy Bill"
            unknown={lead.company.energyBillMonthly == null}
            value={lead.company.energyBillMonthly ? `${formatCurrency(lead.company.energyBillMonthly)}/mo` : undefined}
          />
          <InfoRow
            label="Annual Electricity Usage"
            unknown={lead.company.annualKwhUsage == null}
            value={
              lead.company.annualKwhUsage
                ? `${formatNumber(lead.company.annualKwhUsage)} kWh/yr (${DATA_CONFIDENCE_LABELS[lead.company.annualKwhSource]})`
                : undefined
            }
          />
          <InfoRow
            label="Est. System Size"
            unknown={lead.estimatedKw == null}
            value={
              lead.estimatedKw
                ? `${lead.estimatedKw} kW (${DATA_CONFIDENCE_LABELS[lead.estimatedKwSource]})`
                : undefined
            }
          />
          <InfoRow
            label="Regional Irradiance"
            unknown={lead.company.irradianceKwhPerKwp == null}
            value={
              lead.company.irradianceKwhPerKwp
                ? `${lead.company.irradianceKwhPerKwp} kWh/kWp/yr · ${lead.company.irradianceRegion ?? "UK"} (${DATA_CONFIDENCE_LABELS[lead.company.irradianceSource]})`
                : undefined
            }
          />
          <InfoRow
            label="Last Enriched"
            unknown={!lead.company.lastEnrichedAt}
            value={lead.company.lastEnrichedAt ? formatDateTime(lead.company.lastEnrichedAt) : undefined}
          />
          <InfoRow label="Solar Suitability" value={
            <Badge className={getSuitabilityColor(lead.solarSuitability)}>
              {SOLAR_SUITABILITY_LABELS[lead.solarSuitability]}
            </Badge>
          } />
          <InfoRow label="Lead Source" value={LEAD_SOURCE_LABELS[lead.source]} />
          <InfoRow label="Assigned To" unknown={!lead.assignedTo} value={lead.assignedTo} />
        </Section>

        <Section title="Primary Contact">
          {lead.contact ? (
            <>
              <InfoRow
                label="Name"
                value={`${lead.contact.firstName} ${lead.contact.lastName}`}
              />
              <InfoRow label="Job Title" unknown={!lead.contact.jobTitle} value={lead.contact.jobTitle} />
              <InfoRow
                label="Email"
                unknown={!lead.contact.email}
                value={
                  lead.contact.email ? (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {lead.contact.email}
                    </span>
                  ) : undefined
                }
              />
              <InfoRow
                label="Phone"
                unknown={!lead.contact.phone}
                value={
                  lead.contact.phone ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {lead.contact.phone}
                    </span>
                  ) : undefined
                }
              />
            </>
          ) : (
            <p className="text-sm italic text-slate-400">No contact linked to this lead.</p>
          )}
        </Section>

        <Section title="Pipeline Notes">
          {lead.notes ? (
            <p className="text-sm text-slate-700 leading-relaxed">{lead.notes}</p>
          ) : (
            <p className="text-sm italic text-slate-400">No notes recorded.</p>
          )}
        </Section>
      </div>

      {latestAnalysis && (
        <div className="mt-6 space-y-6">
          <Section title="AI Scoring Breakdown">
            <div className="mb-4 flex items-center gap-3">
              <Badge className={getScoreColor(latestAnalysis.score)}>
                Score: {latestAnalysis.score}/100
              </Badge>
              <Badge className={getCategoryColor(latestAnalysis.category)}>
                Category {latestAnalysis.category}
              </Badge>
              <span className="text-xs text-slate-500">
                Pipeline v{latestAnalysis.pipelineVersion} · {formatDateTime(latestAnalysis.ranAt)}
              </span>
            </div>

            <div className="space-y-3">
              {reasons.map((reason, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-3 ${
                    reason.known
                      ? "border-slate-200 bg-slate-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-900">{reason.factor}</span>
                    <span
                      className={`text-sm font-semibold ${
                        reason.impact >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {reason.impact >= 0 ? "+" : ""}
                      {reason.impact} pts
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{reason.detail}</p>
                  {!reason.known && (
                    <p className="mt-1 text-xs text-amber-700">Based on incomplete data</p>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {unknowns.length > 0 && (
            <Section title="Unknown Fields — Not Guessed">
              <p className="mb-3 text-sm text-slate-500">
                These fields were missing from the record. The scorer did not invent values for them.
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {unknowns.map((field) => (
                  <li
                    key={field}
                    className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
                  >
                    <UnknownBadge label={field} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {lead.analyses.length > 1 && (
            <Section title="Analysis History">
              <div className="space-y-2">
                {lead.analyses.slice(1).map((analysis) => (
                  <div
                    key={analysis.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
                  >
                    <span className="text-slate-600">{formatDateTime(analysis.ranAt)}</span>
                    <div className="flex items-center gap-2">
                      <Badge className={getScoreColor(analysis.score)}>{analysis.score}</Badge>
                      <Badge className={getCategoryColor(analysis.category)}>
                        {analysis.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {!latestAnalysis && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <Zap className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm font-medium text-slate-700">No analysis run yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Click &ldquo;Run Analysis&rdquo; to score this lead and identify unknown fields.
          </p>
        </div>
      )}
    </div>
  );
}

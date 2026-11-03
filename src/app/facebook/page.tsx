import Link from "next/link";
import { CallQueue } from "@/components/CallQueue";
import { FacebookLeadForm } from "@/components/FacebookLeadForm";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { getFacebookLeads } from "@/lib/facebook/ingest";
import { BILL_BAND_LABELS, TIMELINE_LABELS } from "@/lib/facebook/types";
import {
  getQualificationColor,
  getScoreColor,
  QUALIFICATION_LABELS,
} from "@/lib/types";
import { EmailSetupCard } from "@/components/EmailSetupCard";
import { TwilioSetupCard } from "@/components/TwilioSetupCard";
import { TwilioAccountSteps } from "@/components/TwilioAccountSteps";
import { ownerEmailStatus } from "@/lib/email/notify";
import { getFacebookPageAccessToken, getFacebookVerifyToken } from "@/lib/facebook/env";
import { twilioStatus } from "@/lib/twilio/env";

export const dynamic = "force-dynamic";

export default async function FacebookPage() {
  const leads = await getFacebookLeads();
  const verifyReady = Boolean(getFacebookVerifyToken());
  const tokenReady = Boolean(getFacebookPageAccessToken());
  const email = ownerEmailStatus();
  const twilio = twilioStatus();

  return (
    <>
      <PageHeader
        title="Facebook leads"
        description="Form answers land here. Sandbox or Twilio calls qualify consented leads. If they pass, you get an email. Customers are not emailed."
      />

      <div className="mb-8 grid gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Webhook verify token</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {verifyReady ? "Set" : "Missing FACEBOOK_VERIFY_TOKEN"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Page access token</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {tokenReady ? "Set — live Meta fetch enabled" : "Not set — use the test form"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Callback URL</p>
          <p className="mt-1 break-all font-mono text-xs text-slate-700">/api/facebook/leadgen</p>
        </div>
        <EmailSetupCard
          ready={email.ready}
          toAddress={email.toAddress}
          resendConfigured={email.resendConfigured}
        />
        <TwilioSetupCard
          ready={twilio.ready}
          liveEnabled={twilio.liveEnabled}
          accountSidSet={twilio.accountSidSet}
          fromNumber={twilio.fromNumber}
          publicBaseUrl={twilio.publicBaseUrl}
        />
      </div>

      <CallQueue />

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <FacebookLeadForm />
        <TwilioAccountSteps />
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-sm font-semibold text-slate-900">Connect a real Facebook Page</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-600">
            <li>Create a Lead Ad Instant Form with the same questions as the test form, including call consent.</li>
            <li>In Meta for Developers, add the Leadgen webhook to this app’s HTTPS URL + <code className="text-xs">/api/facebook/leadgen</code>.</li>
            <li>Use the verify token from <code className="text-xs">.env</code>.</li>
            <li>Add a Page access token so the webhook can download answers. This app does not scrape Facebook.</li>
          </ol>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-slate-900">
        Inbox <span className="text-sm font-normal text-slate-500">{leads.length} Facebook leads</span>
      </h2>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Homeowner</th>
              <th className="px-4 py-3">Bill</th>
              <th className="px-4 py-3">Consent</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  No Facebook leads yet. Submit the test form.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {lead.contact
                        ? `${lead.contact.firstName} ${lead.contact.lastName}`
                        : lead.company.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {lead.company.postcode}
                      {lead.timeline ? ` · ${TIMELINE_LABELS[lead.timeline] ?? lead.timeline}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{lead.contact?.phone ?? "Unknown"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {lead.homeowner == null ? "Unknown" : lead.homeowner ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {lead.billBand ? BILL_BAND_LABELS[lead.billBand] ?? lead.billBand : "Unknown"}
                  </td>
                  <td className="px-4 py-3">
                    {lead.consentToCall ? (
                      <span className="text-xs font-medium text-emerald-700">Can call later</span>
                    ) : (
                      <span className="text-xs font-medium text-amber-700">Do not call</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge className={getScoreColor(lead.score)}>{lead.score}</Badge>
                      <Badge className={getQualificationColor(lead.qualificationLabel)}>
                        {QUALIFICATION_LABELS[lead.qualificationLabel]}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {lead.consentToCall && (lead.status === "NEW" || lead.status === "CONTACTED") && (
                        <Link
                          href={`/facebook/calls/${lead.id}`}
                          className="text-xs font-medium text-brand-600"
                        >
                          Sandbox call
                        </Link>
                      )}
                      <Link href={`/leads/${lead.id}`} className="text-xs font-medium text-slate-500">
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

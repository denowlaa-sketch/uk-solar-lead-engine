import Link from "next/link";
import { CallQueue } from "@/components/CallQueue";
import { FacebookLeadForm } from "@/components/FacebookLeadForm";
import { FacebookSyncButton } from "@/components/FacebookSyncButton";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { getFacebookLeads } from "@/lib/facebook/ingest";
import { getQualificationColor, QUALIFICATION_LABELS } from "@/lib/types";
import { AlwaysOnCard } from "@/components/AlwaysOnCard";
import { getWatchdogStatus, startFacebookWatchdog } from "@/lib/facebook/watchdog";
import { twilioStatus } from "@/lib/twilio/env";
import { ownerEmailStatus } from "@/lib/email/notify";

export const dynamic = "force-dynamic";

export default async function FacebookPage() {
  startFacebookWatchdog();
  const leads = await getFacebookLeads();
  const alwaysOn = getWatchdogStatus();
  const twilio = twilioStatus();
  const email = ownerEmailStatus();

  return (
    <>
      <PageHeader
        title="Inbox"
        description="People who filled the solar Instant Form. Pull from Meta, then call those who said yes."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <AlwaysOnCard
          running={alwaysOn.running}
          lastPullAt={alwaysOn.lastPullAt}
          lastImported={alwaysOn.lastImported}
          lastError={alwaysOn.lastError}
        />
        <div className="rounded-2xl border border-white/40 bg-[#f7f4ec]/95 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Phone bot</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {twilio.ready ? "Live calls on" : twilio.liveEnabled ? "Twilio not ready" : "Calls paused"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {twilio.fromNumber ?? "No Twilio number"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/40 bg-[#f7f4ec]/95 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Your email</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {email.ready ? "On when they qualify" : "Not set"}
          </p>
          <p className="mt-1 text-xs text-slate-500">{email.toAddress ?? "Add OWNER_NOTIFY_EMAIL"}</p>
        </div>
      </div>

      <div className="mb-6">
        <FacebookSyncButton />
      </div>

      <CallQueue />

      <h2 className="mb-3 text-lg font-semibold text-[#f4f1e8]">
        People <span className="text-sm font-normal text-[#c9cebf]">{leads.length}</span>
      </h2>
      <div className="mb-8 max-w-full overflow-x-auto rounded-2xl border border-white/40 bg-[#f7f4ec]/95 shadow-sm">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200/80 text-xs font-medium uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Call</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200/70">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No Instant Form leads yet.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {lead.contact
                      ? `${lead.contact.firstName} ${lead.contact.lastName}`
                      : lead.company.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{lead.contact?.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    {lead.consentToCall ? (
                      <span className="text-xs font-medium text-emerald-800">Yes</span>
                    ) : (
                      <span className="text-xs font-medium text-amber-800">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={getQualificationColor(lead.qualificationLabel)}>
                      {QUALIFICATION_LABELS[lead.qualificationLabel]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/leads/${lead.id}`} className="text-xs font-medium text-brand-700">
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <details className="rounded-2xl border border-white/40 bg-[#f7f4ec]/95 p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-medium text-slate-800">Test form (manual)</summary>
        <div className="mt-4">
          <FacebookLeadForm />
        </div>
      </details>
    </>
  );
}

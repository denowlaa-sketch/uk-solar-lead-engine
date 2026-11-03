import Link from "next/link";
import { notFound } from "next/navigation";
import { SandboxCallScript } from "@/components/SandboxCallScript";
import { PageHeader } from "@/components/PageHeader";
import { startSandboxCall, getLeadForCall } from "@/lib/facebook/calls";
import { BILL_BAND_LABELS, TIMELINE_LABELS } from "@/lib/facebook/types";
import { NotifyOwnerButton } from "@/components/NotifyOwnerButton";
import { LiveDialButton } from "@/components/LiveDialButton";
import { formatDateTime } from "@/lib/types";
import { twilioStatus } from "@/lib/twilio/env";

export const dynamic = "force-dynamic";

export default async function SandboxCallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLeadForCall(id);
  if (!lead) notFound();

  const started = await startSandboxCall(id);
  const twilio = twilioStatus();

  return (
    <>
      <PageHeader
        title={`Sandbox call · ${lead.contact ? `${lead.contact.firstName} ${lead.contact.lastName}` : lead.company.name}`}
        description="Consented Facebook lead. Use the sandbox script, or place a live Twilio call if configured."
      />

      {"error" in started && (
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {started.error}
        </p>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Phone</p>
          <p className="mt-1 font-medium text-slate-900">{lead.contact?.phone ?? "Unknown"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Postcode</p>
          <p className="mt-1 font-medium text-slate-900">{lead.company.postcode}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Consent</p>
          <p className="mt-1 font-medium text-slate-900">
            {lead.consentToCall ? "Yes — may call" : "No — cannot run"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {lead.consentToCall ? (
          <div className="space-y-4">
            <LiveDialButton
              leadId={lead.id}
              phone={lead.contact?.phone ?? "unknown"}
              enabled={twilio.ready}
            />
            <SandboxCallScript
              leadId={lead.id}
              defaults={{
                homeowner: lead.homeowner,
                billBand: lead.billBand,
                timeline: lead.timeline,
              }}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            This lead did not consent to a call. The bot must not dial.
          </div>
        )}

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Instant Form answers</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Homeowner</dt>
                <dd>{lead.homeowner == null ? "Unknown" : lead.homeowner ? "Yes" : "No"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Bill</dt>
                <dd>{lead.billBand ? BILL_BAND_LABELS[lead.billBand] ?? lead.billBand : "Unknown"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Timeline</dt>
                <dd>{lead.timeline ? TIMELINE_LABELS[lead.timeline] ?? lead.timeline : "Unknown"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Roof</dt>
                <dd>{lead.roofType ?? "Unknown"}</dd>
              </div>
            </dl>
            <Link href={`/leads/${lead.id}`} className="mt-4 inline-block text-xs font-medium text-brand-600">
              Open full lead
            </Link>
          </div>

          {lead.callAttempts.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Call log</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {lead.callAttempts.map((attempt) => (
                  <li key={attempt.id} className="rounded-lg bg-slate-50 px-3 py-2">
                    <span className="font-medium text-slate-800">{attempt.mode}</span>
                    {" · "}
                    {attempt.outcome ?? attempt.status}
                    <div className="text-xs text-slate-500">{formatDateTime(attempt.startedAt)}</div>
                    {attempt.summary && <p className="mt-1 text-xs">{attempt.summary}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Owner emails</h3>
              {lead.status === "QUALIFIED" && <NotifyOwnerButton leadId={lead.id} />}
            </div>
            {lead.notifications.length === 0 ? (
              <p className="text-sm text-slate-500">None yet. Qualify a sandbox call to create one.</p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-600">
                {lead.notifications.map((note) => (
                  <li key={note.id}>
                    <p className="font-medium text-slate-800">{note.subject}</p>
                    <p className="text-xs text-slate-500">
                      {note.status === "sent"
                        ? `Sent${note.toAddress ? ` to ${note.toAddress}` : ""}`
                        : note.status === "failed"
                          ? "Failed to send"
                          : `Sandbox — not sent${note.toAddress ? ` · would go to ${note.toAddress}` : ""}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

import Link from "next/link";
import { Megaphone, Phone, Target, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { getDashboardStats, getRecentLeads } from "@/lib/leads";
import { getWatchdogStatus, startFacebookWatchdog } from "@/lib/facebook/watchdog";
import { Badge } from "@/components/Badge";
import { getQualificationColor, QUALIFICATION_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  startFacebookWatchdog();
  const [stats, recent, meta] = await Promise.all([
    getDashboardStats(),
    getRecentLeads(8),
    Promise.resolve(getWatchdogStatus()),
  ]);

  const waitingCall = stats.waitingCallCount;

  return (
    <>
      <PageHeader title="Home" description="New Instant Form leads, calls, and who is ready for a quote." />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Facebook leads" value={stats.facebookCount} icon={Megaphone} accent="blue" />
        <StatCard
          label="Waiting for a call"
          value={waitingCall}
          icon={Phone}
          accent="violet"
          trend={meta.lastError ? "Meta pull needs attention" : meta.running ? "Meta pull on" : "Meta pull off"}
        />
        <StatCard
          label="Qualified"
          value={stats.qualifiedCount}
          icon={Target}
          accent="emerald"
          trend="Passed the call"
        />
        <StatCard label="Everyone in the CRM" value={stats.totalLeads} icon={Users} accent="amber" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/40 bg-[#f7f4ec]/95 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-200/80 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Latest people</h2>
          <Link href="/facebook" className="text-sm font-medium text-brand-700 hover:text-brand-800">
            Open inbox
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">No leads yet.</p>
        ) : (
          <ul className="divide-y divide-stone-200/70">
            {recent.map((lead) => {
              const name = lead.contact
                ? `${lead.contact.firstName} ${lead.contact.lastName}`
                : lead.company.name;
              return (
                <li key={lead.id}>
                  <Link href={`/leads/${lead.id}`} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-white/60">
                    <div>
                      <p className="font-medium text-slate-900">{name}</p>
                      <p className="text-xs text-slate-500">
                        {lead.contact?.phone ?? "No phone"}
                        {lead.consentToCall ? " · Can call" : " · Do not call"}
                      </p>
                    </div>
                    <Badge className={getQualificationColor(lead.qualificationLabel)}>
                      {QUALIFICATION_LABELS[lead.qualificationLabel]}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

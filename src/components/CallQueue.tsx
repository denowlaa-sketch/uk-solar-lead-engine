import Link from "next/link";
import { Phone } from "lucide-react";
import { getCallQueue } from "@/lib/facebook/calls";
import { BILL_BAND_LABELS } from "@/lib/facebook/types";

export async function CallQueue() {
  const queue = await getCallQueue();

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">
        Call queue
        <span className="ml-2 text-sm font-normal text-slate-500">
          {queue.length} consented · sandbox or live Twilio
        </span>
      </h2>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {queue.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            No consented Facebook leads waiting. Add a test lead with call consent, or complete existing calls.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {queue.map((lead) => (
              <li key={lead.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {lead.contact
                      ? `${lead.contact.firstName} ${lead.contact.lastName}`
                      : lead.company.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lead.contact?.phone} · {lead.company.postcode}
                    {lead.billBand ? ` · ${BILL_BAND_LABELS[lead.billBand] ?? lead.billBand}` : ""}
                  </p>
                </div>
                <Link
                  href={`/facebook/calls/${lead.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Sandbox call
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

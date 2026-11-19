"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function FacebookLeadForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(null);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const res = await fetch("/api/facebook/leads/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save lead");
      setOk(
        data.dial?.dialled
          ? `Lead saved. Twilio is calling ${data.dial.to ?? "the number"} now.`
          : `Lead saved. ${data.dial?.reason ?? "Waiting in the call queue if they consented."}`
      );
      e.currentTarget.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save lead");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Test Instant Form</h2>
      <p className="mt-1 mb-4 text-sm text-slate-500">
        Same short form as the ad: name, email, phone, address, call consent. Qualification happens on the call.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">First name</span>
          <input name="firstName" required className={fieldClass} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Last name</span>
          <input name="lastName" required className={fieldClass} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Phone</span>
          <input name="phone" required className={fieldClass} placeholder="+44 7..." />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Email</span>
          <input name="email" type="email" className={fieldClass} />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block font-medium text-slate-700">Address / postcode</span>
          <input name="address" required className={fieldClass} placeholder="12 High Street, Manchester M14 5TP" />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block font-medium text-slate-700">Consent to an automated call about solar</span>
          <select name="consentToCall" className={fieldClass} defaultValue="yes">
            <option value="yes">Yes — you may call me</option>
            <option value="no">No</option>
          </select>
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save test lead
      </button>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {ok && <p className="mt-3 text-sm text-emerald-700">{ok}</p>}
    </form>
  );
}

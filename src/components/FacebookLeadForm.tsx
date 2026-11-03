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
      setOk(`Lead saved (${data.qualification?.qualificationLabel ?? "NEW"}). No call or email sent.`);
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
      <h2 className="text-sm font-semibold text-slate-900">Simulate Facebook Instant Form</h2>
      <p className="mt-1 mb-4 text-sm text-slate-500">
        Use this until Meta is connected. Same questions your ad form should ask. Nothing is called or emailed.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">First name</span>
          <input name="firstName" required className={fieldClass} defaultValue="Amira" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Last name</span>
          <input name="lastName" required className={fieldClass} defaultValue="Khan" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Phone</span>
          <input name="phone" required className={fieldClass} defaultValue="+44 7700 900123" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Email</span>
          <input name="email" type="email" className={fieldClass} defaultValue="amira.khan@example.com" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Postcode</span>
          <input name="postcode" required className={fieldClass} defaultValue="M14 5TP" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">City</span>
          <input name="city" className={fieldClass} defaultValue="Manchester" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Homeowner?</span>
          <select name="homeowner" className={fieldClass} defaultValue="yes">
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Monthly electricity bill</span>
          <select name="billBand" className={fieldClass} defaultValue="100_150">
            <option value="under_50">Under £50</option>
            <option value="50_100">£50–£100</option>
            <option value="100_150">£100–£150</option>
            <option value="150_plus">£150+</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Roof type</span>
          <select name="roofType" className={fieldClass} defaultValue="Pitched tile">
            <option>Pitched tile</option>
            <option>Slate</option>
            <option>Flat</option>
            <option>Unknown</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Timeline</span>
          <select name="timeline" className={fieldClass} defaultValue="3_months">
            <option value="now">Ready now</option>
            <option value="3_months">Within 3 months</option>
            <option value="6_months">Within 6 months</option>
            <option value="researching">Just researching</option>
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block font-medium text-slate-700">Consent to call about solar</span>
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

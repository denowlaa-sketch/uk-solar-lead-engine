"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Props = {
  leadId: string;
  defaults: {
    homeowner?: boolean | null;
    billBand?: string | null;
    timeline?: string | null;
  };
};

export function SandboxCallScript({ leadId, defaults }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function submit(extra?: Record<string, string>) {
    setLoading(true);
    setError(null);
    setDone(null);
    const form = document.getElementById("call-script") as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch(`/api/calls/${leadId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, ...extra }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Call could not be saved");
      setDone(
        json.outcome === "QUALIFIED"
          ? json.sentEmail
            ? "Qualified. An email was sent to your inbox. No live call. Customer was not emailed."
            : json.emailStatus === "failed"
              ? `Qualified, but owner email failed: ${json.emailError ?? "check Resend settings"}.`
              : "Qualified. Owner email stayed sandbox (set OWNER_NOTIFY_EMAIL and RESEND_API_KEY). No live call."
          : `Outcome: ${json.outcome}. No live call. Customer was not emailed.`
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Call could not be saved");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

  return (
    <form
      id="call-script"
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <h2 className="text-sm font-semibold text-slate-900">Sandbox call script</h2>
      <p className="mt-1 mb-4 text-sm text-slate-500">
        Pretend the bot asked these. Nothing is dialled. Prefills come from the Instant Form.
      </p>
      <ol className="space-y-3 text-sm">
        <li>
          <p className="mb-1 font-medium text-slate-800">1. Are you still interested in solar?</p>
          <select name="stillInterested" className={fieldClass} defaultValue="yes">
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </li>
        <li>
          <p className="mb-1 font-medium text-slate-800">2. Do you own the property?</p>
          <select
            name="homeowner"
            className={fieldClass}
            defaultValue={defaults.homeowner === false ? "no" : "yes"}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </li>
        <li>
          <p className="mb-1 font-medium text-slate-800">3. Rough monthly electricity bill?</p>
          <select name="billBand" className={fieldClass} defaultValue={defaults.billBand ?? "100_150"}>
            <option value="under_50">Under £50</option>
            <option value="50_100">£50–£100</option>
            <option value="100_150">£100–£150</option>
            <option value="150_plus">£150+</option>
          </select>
        </li>
        <li>
          <p className="mb-1 font-medium text-slate-800">4. When do you want to install?</p>
          <select name="timeline" className={fieldClass} defaultValue={defaults.timeline ?? "3_months"}>
            <option value="now">Ready now</option>
            <option value="3_months">Within 3 months</option>
            <option value="6_months">Within 6 months</option>
            <option value="researching">Just researching</option>
          </select>
        </li>
        <li>
          <p className="mb-1 font-medium text-slate-800">5. Is the roof in decent condition, not heavily shaded?</p>
          <select name="roofOk" className={fieldClass} defaultValue="yes">
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </li>
        <li>
          <p className="mb-1 font-medium text-slate-800">6. Can an advisor follow up with you?</p>
          <select name="followUpOk" className={fieldClass} defaultValue="yes">
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </li>
        <li>
          <p className="mb-1 font-medium text-slate-800">Notes</p>
          <textarea name="notes" rows={3} className={fieldClass} placeholder="Optional" />
        </li>
      </ol>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Complete sandbox call
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => submit({ outcome: "NO_ANSWER" })}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          No answer
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => submit({ outcome: "CALLBACK" })}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Call back later
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {done && <p className="mt-3 text-sm text-emerald-700">{done}</p>}
    </form>
  );
}

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

type EmailSetupCardProps = {
  ready: boolean;
  toAddress: string | null;
  resendConfigured: boolean;
};

export function EmailSetupCard({ ready, toAddress, resendConfigured }: EmailSetupCardProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendTest() {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/email/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Test email failed");
      setMessage(`Sent a test to ${data.to}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test email failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">Owner follow-up email</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {ready ? `On · ${toAddress}` : "Sandbox only — not sending yet"}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {!resendConfigured && "Add RESEND_API_KEY from resend.com. "}
        {!toAddress && "Set OWNER_NOTIFY_EMAIL to your inbox. "}
        Customers are never emailed from this step.
      </p>
      <button
        type="button"
        onClick={() => void sendTest()}
        disabled={loading || !ready}
        className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {loading ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : "Send test email"}
      </button>
      {message && <p className="mt-2 text-xs text-emerald-700">{message}</p>}
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}

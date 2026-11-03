"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone } from "lucide-react";

type Props = {
  leadId: string;
  phone: string;
  enabled: boolean;
};

export function LiveDialButton({ leadId, phone, enabled }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!polling) return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/calls/${leadId}`);
      const json = await res.json();
      const latest = json.latestAttempt;
      if (latest?.status === "COMPLETED" || latest?.status === "BLOCKED") {
        setPolling(false);
        setInfo(
          latest.outcome
            ? `Live call finished: ${latest.outcome}. ${latest.summary ?? ""}`
            : latest.summary ?? "Call ended."
        );
        router.refresh();
      } else if (latest?.providerStatus) {
        setInfo(`Call status: ${latest.providerStatus}`);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [leadId, polling, router]);

  async function dial() {
    if (!window.confirm(`Twilio will ring ${phone} now. Continue?`)) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/calls/${leadId}/dial`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Dial failed");
      setInfo(`Calling ${json.to}. Answer and use the keypad.`);
      setPolling(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dial failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Live Twilio call</h2>
      <p className="mt-1 mb-4 text-sm text-slate-500">
        Rings the consented number. The bot asks the same six questions by keypad. Customers are not emailed.
      </p>
      <button
        type="button"
        disabled={loading || !enabled}
        onClick={() => void dial()}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
        Place live call
      </button>
      {!enabled && (
        <p className="mt-3 text-xs text-amber-800">
          Finish Twilio setup and set TWILIO_LIVE_DIALS=true. Trial accounts can only call numbers you verified in Twilio.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {info && <p className="mt-3 text-sm text-emerald-700">{info}</p>}
    </div>
  );
}

type TwilioSetupCardProps = {
  ready: boolean;
  liveEnabled: boolean;
  accountSidSet: boolean;
  fromNumber: string | null;
  publicBaseUrl: string | null;
};

export function TwilioSetupCard({
  ready,
  liveEnabled,
  accountSidSet,
  fromNumber,
  publicBaseUrl,
}: TwilioSetupCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">Twilio live calls</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {ready ? `On · ${fromNumber}` : liveEnabled ? "Keys incomplete" : "Off — sandbox only"}
      </p>
      <ul className="mt-2 space-y-1 text-xs text-slate-500">
        <li>{accountSidSet ? "Account SID set" : "Missing TWILIO_ACCOUNT_SID"}</li>
        <li>{fromNumber ? `From ${fromNumber}` : "Missing TWILIO_PHONE_NUMBER"}</li>
        <li>{publicBaseUrl ? "Public URL set" : "Missing TWILIO_PUBLIC_BASE_URL (ngrok https)"}</li>
        <li>{liveEnabled ? "TWILIO_LIVE_DIALS=true" : "Set TWILIO_LIVE_DIALS=true to ring a real phone"}</li>
      </ul>
    </div>
  );
}

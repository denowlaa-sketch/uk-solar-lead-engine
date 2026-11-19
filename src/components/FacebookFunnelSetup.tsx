type Props = {
  callbackUrl: string;
  verifyToken: string;
  pageTokenReady: boolean;
  twilioReady: boolean;
};

export function FacebookFunnelSetup({
  callbackUrl,
  verifyToken,
  pageTokenReady,
  twilioReady,
}: Props) {
  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Facebook Page → CRM → auto-call</h2>
      <p className="mt-1 mb-4 text-sm text-slate-500">
        This app cannot create a Facebook Page for you. You create the Page and Lead Ad in Meta. When
        someone submits the Instant Form with call consent, they land here and Twilio rings them if live
        dials are on.
      </p>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatusPill ok={Boolean(verifyToken)} label="Verify token" />
        <StatusPill ok={pageTokenReady} label="Page access token" />
        <StatusPill ok={twilioReady} label="Twilio auto-call" />
      </div>

      <ol className="list-decimal space-y-4 pl-5 text-sm text-slate-700">
        <li>
          <p className="font-medium text-slate-900">Create the Facebook Page</p>
          <p className="mt-1 text-slate-600">
            Open{" "}
            <a
              className="font-medium text-brand-700 underline"
              href="https://www.facebook.com/pages/create"
              target="_blank"
              rel="noreferrer"
            >
              facebook.com/pages/create
            </a>
            . Category: local service / solar energy. Name it something like{" "}
            <strong>UK Home Solar Quotes</strong>. Add a profile photo, cover, and UK phone if you have one.
          </p>
        </li>
        <li>
          <p className="font-medium text-slate-900">Create a Meta developer app</p>
          <p className="mt-1 text-slate-600">
            Open{" "}
            <a
              className="font-medium text-brand-700 underline"
              href="https://developers.facebook.com/apps/"
              target="_blank"
              rel="noreferrer"
            >
              developers.facebook.com/apps
            </a>
            . Add product <strong>Webhooks</strong> and <strong>Lead Ads</strong> (or Marketing API). Subscribe
            the webhook:
          </p>
          <ul className="mt-2 space-y-1 rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-800">
            <li>Callback URL: {callbackUrl}</li>
            <li>Verify token: {verifyToken || "FACEBOOK_VERIFY_TOKEN"}</li>
            <li>Subscription field: leadgen</li>
          </ul>
          <p className="mt-2 text-slate-600">
            The callback must be public HTTPS (same ngrok URL as Twilio). Copy the Page access token and App
            Secret into <code className="text-xs">.env</code> as{" "}
            <code className="text-xs">FACEBOOK_PAGE_ACCESS_TOKEN</code> and{" "}
            <code className="text-xs">FACEBOOK_APP_SECRET</code>.
          </p>
        </li>
        <li>
          <p className="font-medium text-slate-900">Instant Form questions (must match)</p>
          <p className="mt-1 text-slate-600">
            Keep the Instant Form short. Qualification questions are asked on the Twilio call, not on the form.
          </p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="px-3 py-2">Form field</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="px-3 py-2">Full name</td>
                  <td className="px-3 py-2">Prefill</td>
                  <td className="px-3 py-2">Required</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Email</td>
                  <td className="px-3 py-2">Prefill</td>
                  <td className="px-3 py-2">Required</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Phone</td>
                  <td className="px-3 py-2">Prefill</td>
                  <td className="px-3 py-2">Required to call</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Postcode / street address</td>
                  <td className="px-3 py-2">Prefill</td>
                  <td className="px-3 py-2">UK postcode at minimum</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">I agree to an automated call about solar</td>
                  <td className="px-3 py-2">Multiple choice — required</td>
                  <td className="px-3 py-2">Yes — you may call me / No. Without this the bot must not dial.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-slate-600">
            Homeowner, bill, roof, timeline, and advisor follow-up are asked on the call. Only{" "}
            <strong>Yes — you may call me</strong> is treated as consent.
          </p>
        </li>
        <li>
          <p className="font-medium text-slate-900">Run the advert</p>
          <p className="mt-1 text-slate-600">
            Campaign objective: <strong>Leads</strong>. Audience: UK homeowners. Creative: short solar savings
            ad that opens the Instant Form (not a website). Meta billing must be active. This app does not
            scrape Facebook or place ads for you.
          </p>
        </li>
        <li>
          <p className="font-medium text-slate-900">Auto-qualify on Twilio</p>
          <p className="mt-1 text-slate-600">
            {twilioReady
              ? "Live dials are on. New consented leads are called automatically."
              : "Finish Twilio (SID, token, number, public HTTPS URL) and set TWILIO_LIVE_DIALS=true. Until then, consented leads wait in the call queue."}
          </p>
        </li>
      </ol>
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${ok ? "text-emerald-700" : "text-amber-800"}`}>
        {ok ? "Ready" : "Not ready"}
      </p>
    </div>
  );
}

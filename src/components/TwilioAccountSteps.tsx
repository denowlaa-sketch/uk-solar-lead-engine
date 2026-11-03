export function TwilioAccountSteps() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="text-sm font-semibold text-slate-900">Create a Twilio account</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-600">
        <li>
          Open{" "}
          <a className="font-medium text-brand-700 underline" href="https://www.twilio.com/try-twilio" target="_blank" rel="noreferrer">
            twilio.com/try-twilio
          </a>{" "}
          and sign up with your email.
        </li>
        <li>Verify your email, then verify your mobile when Twilio asks.</li>
        <li>
          On the console home, copy <strong>Account SID</strong> and <strong>Auth Token</strong> (click the eye).
        </li>
        <li>
          Go to <strong>Phone Numbers → Manage → Buy a number</strong>. A UK number is best; a trial US number also works for tests.
        </li>
        <li>
          Trial accounts can only call numbers listed under <strong>Verified Caller IDs</strong>. Add the mobile you will test with.
        </li>
        <li>
          Paste SID, token, and the Twilio number into <code className="text-xs">.env</code>. Run{" "}
          <code className="text-xs">ngrok http 3000</code> and put the https URL in{" "}
          <code className="text-xs">TWILIO_PUBLIC_BASE_URL</code>.
        </li>
        <li>
          Set <code className="text-xs">TWILIO_LIVE_DIALS=true</code> only when you are ready to ring that verified phone.
        </li>
      </ol>
    </div>
  );
}

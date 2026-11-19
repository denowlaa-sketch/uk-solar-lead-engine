type Props = {
  whatsappFrom: string | null;
  channel: string;
};

export function WhatsAppSetup({ whatsappFrom, channel }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="text-sm font-semibold text-slate-900">WhatsApp calls (international numbers)</h2>
      <p className="mt-1 text-sm text-slate-600">
        Phone calls still work. WhatsApp is preferred when a sender is set, because many people abroad will
        answer WhatsApp but not a UK landline.
      </p>
      <p className="mt-2 text-xs font-medium text-slate-700">
        {whatsappFrom ? `WhatsApp sender ${whatsappFrom} · channel ${channel}` : "WhatsApp sender not set yet"}
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-600">
        <li>
          In Twilio Console open <strong>Messaging → WhatsApp senders</strong> and register a number (often the
          same +44 1708 985576) with Meta WhatsApp.
        </li>
        <li>
          Complete Meta Business Verification so calling can be switched on. Then on the sender, set{" "}
          <strong>Voice Endpoint Configuration</strong> to a TwiML app pointing at{" "}
          <code className="text-xs">TWILIO_PUBLIC_BASE_URL/api/twilio/whatsapp</code> for messages, and the
          existing voice URLs for calls.
        </li>
        <li>
          Content Template Builder → Call to action → <strong>Voice Call Request</strong>. Copy the Content SID
          (starts with HX).
        </li>
        <li>
          Put in <code className="text-xs">.env</code>:{" "}
          <code className="text-xs">TWILIO_WHATSAPP_FROM=whatsapp:+441708985576</code>,{" "}
          <code className="text-xs">TWILIO_WHATSAPP_CONTENT_SID=HXxxx</code>,{" "}
          <code className="text-xs">TWILIO_CALL_CHANNEL=auto</code>
        </li>
        <li>
          Restart the app. A consented lead gets a WhatsApp “allow this call” prompt, then the spoken bot. If
          WhatsApp is not ready, the UK phone number is used instead.
        </li>
      </ol>
    </div>
  );
}

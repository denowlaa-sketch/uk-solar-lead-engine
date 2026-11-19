export const metadata = {
  title: "Privacy Policy | UK Solar Lead Engine",
  description: "How Leadsgehn collects and uses Instant Form and call data for UK home solar enquiries.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl text-slate-800">
      <h1 className="text-3xl font-semibold text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: 5 November 2026</p>

      <p className="mt-6 text-sm leading-6">
        This notice is for people who submit a Facebook Instant Form or otherwise enquire about home solar
        through <strong>Leadsgehn</strong> (trading as UK Solar Lead Engine). It explains what we collect, why,
        and your rights under UK GDPR and the Privacy and Electronic Communications Regulations (PECR).
      </p>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold text-slate-900">Who we are</h2>
        <p>
          Controller: Leadsgehn. Contact:{" "}
          <a className="text-brand-700 underline" href="mailto:leadsgehn@gmail.com">
            leadsgehn@gmail.com
          </a>
          .
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold text-slate-900">What we collect</h2>
        <p>From Meta Instant Forms and related tools we may receive:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Name, email, phone number, postcode, and town or city</li>
          <li>Whether you own the property, bill band, roof type, and install timeline</li>
          <li>Whether you agreed to an automated phone call about solar</li>
          <li>Meta lead, form, and Page identifiers</li>
        </ul>
        <p>
          If you agree to a call, we may store call answers (for example interest, roof suitability, follow-up
          preference) and the outcome of that call. We email our own inbox when a lead is qualified. We do not
          email you from that step unless you have separately asked for email contact.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold text-slate-900">Why we use your data</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>To handle your solar enquiry and score whether a quote is likely to be suitable</li>
          <li>
            To phone you using an automated or assisted call <strong>only if you ticked that you agree to be
            called</strong> (PECR)
          </li>
          <li>To keep records of consent, calls, and qualification so we can follow up fairly</li>
        </ul>
        <p>Legal bases: your consent (calls and form submit), and legitimate interests in handling an enquiry you started.</p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold text-slate-900">Who we share with</h2>
        <p>
          Meta Platforms Ireland Limited provides the Instant Form. Twilio may place the phone call if you
          consented. Hosting and email providers process data on our instructions. We do not sell your data.
          We do not scrape Facebook.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold text-slate-900">How long we keep it</h2>
        <p>
          Enquiry and call records are kept for up to 24 months, or sooner if you ask us to delete them and we
          have no legal need to retain them.
        </p>
      </section>

      <section className="mt-8 space-y-3 text-sm leading-6">
        <h2 className="text-lg font-semibold text-slate-900">Your rights</h2>
        <p>
          You can ask for a copy of your data, correction, deletion, or to withdraw call consent. Email{" "}
          <a className="text-brand-700 underline" href="mailto:leadsgehn@gmail.com">
            leadsgehn@gmail.com
          </a>
          . You can complain to the ICO at{" "}
          <a className="text-brand-700 underline" href="https://ico.org.uk" target="_blank" rel="noreferrer">
            ico.org.uk
          </a>
          .
        </p>
      </section>
    </article>
  );
}

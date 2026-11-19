export const metadata = {
  title: "Thanks | UK Solar Lead Engine",
};

export default function ThanksPage() {
  return (
    <div className="mx-auto max-w-xl py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Thanks — you are all set</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        We have your enquiry. If you agreed to a call, we may phone you about a UK home solar quote. If you
        did not agree, we will not call.
      </p>
      <p className="mt-4 text-sm text-slate-600">
        Questions or to withdraw consent:{" "}
        <a className="text-brand-700 underline" href="mailto:leadsgehn@gmail.com">
          leadsgehn@gmail.com
        </a>
      </p>
      <a className="mt-6 inline-block text-sm font-medium text-brand-700" href="/privacy">
        Privacy policy
      </a>
    </div>
  );
}

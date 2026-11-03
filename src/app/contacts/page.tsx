import { PageHeader } from "@/components/PageHeader";
import { UnknownBadge } from "@/components/UnknownBadge";
import { getContacts } from "@/lib/leads";

export default async function ContactsPage() {
  const contacts = await getContacts();

  return (
    <>
      <PageHeader
        title="Contacts"
        description={`${contacts.length} decision-makers across your pipeline`}
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Job Title</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Leads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {contact.firstName} {contact.lastName}
                    </div>
                    {contact.isPrimary && (
                      <span className="text-xs text-brand-600">Primary contact</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {contact.jobTitle ?? <UnknownBadge label="No job title" />}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {contact.company.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {contact.email ?? <UnknownBadge label="No email" />}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {contact.phone ?? <UnknownBadge label="No phone" />}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {contact.company.city}, {contact.company.postcode}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{contact._count.leads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

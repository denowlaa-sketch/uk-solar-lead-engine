import { PageHeader } from "@/components/PageHeader";
import { LeadsTable } from "@/components/LeadsTable";
import { getLeads } from "@/lib/leads";
import type { LeadStatus } from "@prisma/client";

type SearchParams = Promise<{
  status?: string;
  search?: string;
}>;

export default async function LeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const leads = await getLeads({
    status: params.status as LeadStatus | undefined,
    search: params.search,
  });

  return (
    <>
      <PageHeader title="All leads" description={`${leads.length} people in the CRM`} />
      <form className="mb-6" action="/leads">
        <input
          name="search"
          defaultValue={params.search ?? ""}
          placeholder="Search name or phone"
          className="w-full max-w-md rounded-xl border border-white/40 bg-[#f7f4ec]/95 px-4 py-2.5 text-sm shadow-sm outline-none ring-brand-600/30 focus:ring-2"
        />
      </form>
      <LeadsTable leads={leads} compact />
    </>
  );
}

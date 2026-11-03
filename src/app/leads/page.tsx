import { PageHeader } from "@/components/PageHeader";
import { LeadsTable } from "@/components/LeadsTable";
import { LeadFilters } from "@/components/LeadFilters";
import { RunAnalysisButton } from "@/components/RunAnalysisButton";
import { getLeads } from "@/lib/leads";
import type { LeadCategory, LeadStatus, QualificationLabel } from "@prisma/client";

type SearchParams = Promise<{
  status?: string;
  category?: string;
  qualification?: string;
  search?: string;
  minScore?: string;
}>;

export default async function LeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const leads = await getLeads({
    status: params.status as LeadStatus | undefined,
    category: params.category as LeadCategory | undefined,
    qualification: params.qualification as QualificationLabel | undefined,
    search: params.search,
    minScore: params.minScore ? parseInt(params.minScore, 10) : undefined,
  });

  return (
    <>
      <PageHeader
        title="Leads"
        description={`${leads.length} lead${leads.length !== 1 ? "s" : ""} in your pipeline`}
      >
        <RunAnalysisButton label="Analyse All Leads" />
      </PageHeader>

      <div className="mb-6">
        <LeadFilters
          initialStatus={params.status ?? ""}
          initialCategory={params.category ?? ""}
          initialQualification={params.qualification ?? ""}
          initialSearch={params.search ?? ""}
          initialMinScore={params.minScore ?? ""}
        />
      </div>

      <LeadsTable leads={leads} />
    </>
  );
}

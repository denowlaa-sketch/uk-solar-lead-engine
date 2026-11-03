import { notFound } from "next/navigation";
import { LeadDetailView } from "@/components/LeadDetailView";
import { getLeadById } from "@/lib/leads";

type Params = Promise<{ id: string }>;

export default async function LeadDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const lead = await getLeadById(id);

  if (!lead) notFound();

  return <LeadDetailView lead={lead} />;
}

import { Megaphone, Phone, Sparkles, Target, TrendingUp, Zap } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusChart } from "@/components/StatusChart";
import { CategoryChart } from "@/components/CategoryChart";
import { ScoreDistributionChart } from "@/components/ScoreDistributionChart";
import { TopLeads } from "@/components/TopLeads";
import { LeadsTable } from "@/components/LeadsTable";
import { LeadFilters } from "@/components/LeadFilters";
import { RunAnalysisButton } from "@/components/RunAnalysisButton";
import { getDashboardStats, getLeads } from "@/lib/leads";
import type { LeadCategory, LeadStatus, QualificationLabel } from "@prisma/client";

type SearchParams = Promise<{
  status?: string;
  category?: string;
  qualification?: string;
  search?: string;
  minScore?: string;
}>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const filters = {
    status: params.status as LeadStatus | undefined,
    category: params.category as LeadCategory | undefined,
    qualification: params.qualification as QualificationLabel | undefined,
    search: params.search,
    minScore: params.minScore ? parseInt(params.minScore, 10) : undefined,
  };

  const [stats, leads, topLeads] = await Promise.all([
    getDashboardStats(),
    getLeads(filters),
    getLeads(),
  ]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Facebook ad leads and pipeline. Call bot and owner emails are not enabled yet."
      >
        <RunAnalysisButton label="Analyse All Leads" />
      </PageHeader>

      <div className="mb-6">
        <LeadFilters
          basePath="/"
          initialStatus={params.status ?? ""}
          initialCategory={params.category ?? ""}
          initialQualification={params.qualification ?? ""}
          initialSearch={params.search ?? ""}
          initialMinScore={params.minScore ?? ""}
        />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Leads" value={stats.totalLeads} icon={Zap} accent="emerald" />
        <StatCard
          label="Facebook leads"
          value={stats.facebookCount}
          icon={Megaphone}
          accent="blue"
        />
        <StatCard
          label="Consented to call"
          value={stats.consentedCount}
          icon={Phone}
          accent="violet"
          trend="Not dialled yet"
        />
        <StatCard
          label="Avg. Score"
          value={stats.avgScore}
          icon={TrendingUp}
          accent="amber"
          trend={`${stats.analysedCount} analysed`}
        />
        <StatCard
          label="A-Tier Leads"
          value={stats.aTierCount}
          icon={Sparkles}
          accent="violet"
          trend="Score 80+"
        />
        <StatCard
          label="Qualified Pipeline"
          value={stats.qualifiedCount}
          icon={Target}
          accent="emerald"
          trend={`${stats.wonCount} won`}
        />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <StatusChart data={stats.statusCounts} total={stats.totalLeads} />
        <CategoryChart data={stats.categoryCounts} total={stats.analysedCount} />
        <ScoreDistributionChart buckets={stats.scoreBuckets} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Leads {filters.search || filters.status || filters.category ? "(filtered)" : ""}
            </h2>
            <span className="text-sm text-slate-500">{leads.length} results</span>
          </div>
          <LeadsTable leads={leads} compact />
        </div>
        <TopLeads leads={topLeads} />
      </div>
    </>
  );
}

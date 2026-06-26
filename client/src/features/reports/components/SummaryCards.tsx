'use client';

import { ClipboardDocumentListIcon, PlayIcon, CheckCircleIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useSummaryReport } from '@/features/reports/hooks/useReports';

interface SummaryCardsProps {
  projectId: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
}

function StatCard({ title, value, subtitle, icon, iconBg }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1.5 text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function SummaryCards({ projectId }: SummaryCardsProps) {
  const { data, isLoading } = useSummaryReport(projectId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-5 h-28 flex items-center justify-center">
            <Spinner />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Total Test Cases"
        value={data.totalCases}
        subtitle={`${data.activeCases} active · ${data.draftCases} draft`}
        icon={<ClipboardDocumentListIcon className="h-5 w-5 text-primary-600" />}
        iconBg="bg-primary-50"
      />
      <StatCard
        title="Total Test Runs"
        value={data.totalRuns}
        subtitle={`${data.completedRuns} completed`}
        icon={<PlayIcon className="h-5 w-5 text-primary-500" />}
        iconBg="bg-primary-50"
      />
      <StatCard
        title="Pass Rate"
        value={`${(data.passRate * 100).toFixed(1)}%`}
        subtitle="Across all completed runs"
        icon={<CheckCircleIcon className="h-5 w-5 text-emerald-600" />}
        iconBg="bg-emerald-50"
      />
      <StatCard
        title="In Progress"
        value={data.inProgressRuns}
        subtitle="Active runs"
        icon={<ChartBarIcon className="h-5 w-5 text-amber-600" />}
        iconBg="bg-amber-50"
      />
    </div>
  );
}

'use client';

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/shared/components/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { SummaryCards } from '@/features/reports/components/SummaryCards';
import { RunHistoryChart } from '@/features/reports/components/RunHistoryChart';
import { SuiteBreakdown } from '@/features/reports/components/SuiteBreakdown';
import { DefectTrendChart } from '@/features/reports/components/DefectTrendChart';
import { AutomationCoverageChart } from '@/features/reports/components/AutomationCoverageChart';
import { PassRateTrendChart } from '@/features/reports/components/PassRateTrendChart';
import { RequirementCoverageCard } from '@/features/reports/components/RequirementCoverageCard';
import { ReleaseReadinessCard } from '@/features/reports/components/ReleaseReadinessCard';
import { SprintSummaryReport } from '@/features/reports/components/SprintSummaryReport';

interface ReportsPageProps {
  params: { projectId: string };
}

export default function ReportsPage({ params }: ReportsPageProps) {
  const { projectId } = params;

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Test metrics and analytics for this project"
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => window.print()}
            leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
            className="print:hidden"
          >
            Download PDF
          </Button>
        }
      />
      <div className="px-8 py-6 space-y-6 print:px-0 print:py-4">
        <ReleaseReadinessCard projectId={projectId} />
        <SprintSummaryReport projectId={projectId} />
        <SummaryCards projectId={projectId} />
        <RunHistoryChart projectId={projectId} />
        <SuiteBreakdown projectId={projectId} />

        {/* New analytics charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 print:grid-cols-2">
          <DefectTrendChart projectId={projectId} />
          <PassRateTrendChart projectId={projectId} />
        </div>

        <AutomationCoverageChart projectId={projectId} />
        <RequirementCoverageCard projectId={projectId} />
      </div>
    </div>
  );
}

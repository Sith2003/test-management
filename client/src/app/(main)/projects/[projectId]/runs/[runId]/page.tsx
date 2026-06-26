'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/shared/components/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { TestRunExecutor } from '@/features/test-runs/components/TestRunExecutor';
import { useTestRun } from '@/features/test-runs/hooks/useTestRuns';
import { exportService } from '@/features/exports/exportService';

interface RunDetailPageProps {
  params: { projectId: string; runId: string };
}

export default function RunDetailPage({ params }: RunDetailPageProps) {
  const { projectId, runId } = params;
  const { data: run } = useTestRun(projectId, runId);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await exportService.downloadRunResultsExcel(projectId, runId);
    } catch {
      // silent
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      <PageHeader
        title={run?.name ?? 'Test Run'}
        description={run?.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
              onClick={handleExportExcel}
              isLoading={isExporting}
            >
              Export Excel
            </Button>
            <Link
              href={`/projects/${projectId}/runs`}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Runs
            </Link>
          </div>
        }
      />
      <div className="px-8 py-6 flex-1">
        <TestRunExecutor projectId={projectId} runId={runId} />
      </div>
    </div>
  );
}

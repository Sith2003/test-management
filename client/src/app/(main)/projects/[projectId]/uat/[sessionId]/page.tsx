'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { UatExecutor } from '@/features/uat/components/UatExecutor';
import { PageHeader } from '@/shared/components/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { exportService } from '@/features/exports/exportService';

interface Props {
  params: { projectId: string; sessionId: string };
}

export default function UatSessionPage({ params }: Props) {
  const { projectId, sessionId } = params;
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      await exportService.downloadUatReportPdf(projectId, sessionId);
    } catch {
      // silent
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      <PageHeader
        title="UAT Session"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
              onClick={handleExportPdf}
              isLoading={isExporting}
            >
              Export PDF
            </Button>
            <Link
              href={`/projects/${projectId}/uat`}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to UAT
            </Link>
          </div>
        }
      />
      <div className="px-8 py-6 flex-1">
        <UatExecutor projectId={projectId} sessionId={sessionId} />
      </div>
    </div>
  );
}
